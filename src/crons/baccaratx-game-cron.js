import { GameCron } from "sc-card-game-base/src/crons";
import BaccaratGameDefinition from "../baccarat-game-definition";
import { GameData } from "sc-card-game-base";
import { BaccaratXBot } from "./";
import { CutCardConsumer, RoundResultConsumer, SettleGameRoundConsumer } from "../consumers";

export default class BaccaratXGameCron extends GameCron {
    /**
     *
     * @param {Object} dependencies
     * @param {BaccaratGameDefinition} dependencies.definition
     * @param {GameData} dependencies.gameData
     * @param {BaccaratXBot} dependencies.bot
     * @param {SettleGameRoundConsumer} dependencies.settleGameRoundConsumer
     * @param {GameStatusPublisher} dependencies.gameStatusPublisher
     * @param {RunningRoundInfoPublisher} dependencies.runningRoundInfoPublisher
     * @param {logger} dependencies.logService
     * @param {RoundResultConsumer} dependencies.roundResultConsumer
     * @param {mongoose.Model} dependencies.resultsRepository
     * @param {GameManagementApiClientFactory} dependencies.gameManagementApiClientFactory
     * @param {RoundIdConsumer} dependencies.roundIdConsumer
     * @param {ProvablyFairConsumer} dependencies.provablyFairConsumer
     * @param {UnsettledRoundConsumer} dependencies.unsettledRoundConsumer
     * @param {CutCardConsumer} dependencies.cutCardConsumer
     */
    constructor({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        roundResultConsumer,
        resultsRepository,
        appConfigs,
        gameManagementApiClientFactory,
        roundIdConsumer,
        provablyFairConsumer,
        unsettledRoundConsumer,
        cutCardConsumer,
        shoeConsumer,
    }) {
        super({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher,
            logService,
            roundResultConsumer,
            resultsRepository,
            appConfigs,
            gameManagementApiClientFactory,
            roundIdConsumer,
            provablyFairConsumer,
            unsettledRoundConsumer,
        });

        this.cutCardConsumer = cutCardConsumer;
        this.shoeConsumer = shoeConsumer;
    }

    async start() {
        await this.roundIdConsumer.initRoundId();
        await this.queryLastResult();
        await this.getSettingForNewRound();
        await this.updateExchangeRates();

        await this.initShoe();
        await this.initNewRound();
        this.startCron();
    }

    async initShoe() {
        if (this.resultsRepository) {
            const results = await this.resultsRepository
                .findOne({ isAvailable: true }, null, { sort: { time: -1 } })
                .lean()
                .exec();
            if (results?.shoe) {
                const decryptShoe = this.shoeConsumer.decryptShoe(results.shoe);

                this.gameData.shoe = { ...results, ...decryptShoe };
            }
        }
    }

    async proceed() {
        const { durations } = this.definition;

        if (this.gameData.isNewRound) {
            await this.checkGameStatus();

            if (!this.gameData.disabled) {
                this.gameData.isNewRound = false;
            }
        }

        if (!this.gameData.disabled && this.gameData.remainingTime === durations.generatingShoe) {
            await this.resetForNewRoundWhenChangingShoe();

            const isHavingSufficientChain = await this.generateAndPublishShoe();
            if (isHavingSufficientChain) {
                this.gameData.remainingTime--;
            }
        } else if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }

        if (this.gameData.remainingTime === durations.generatingCutCardIndex) {
            await this.roundIdConsumer.updateAndPublishFinalCutCardIndex();
        }

        if (this.isStartingTime(this.gameData.remainingTime, durations)) {
            this.resetForNewRound();
            this.bot && (await this.bot.reset());
            this.appConfigs.enabledBoostedOdds && (await this.updatePromotionOddsAndNotify());
        }

        const remainingTime = this.gameData.remainingTime;
        if (remainingTime === durations.placingBets) {
            this.gameStatusPublisher.publishStartPlacingBetStatus();
        }

        if (remainingTime === durations.lockingBet - 1) {
            this.gameStatusPublisher.publishEndPlacingBetStatus();
        }

        if (this.gameData.remainingTime < 0) {
            await this.initNewRound();
            await this.settleGameRoundConsumer.settleRound();
        } else if (this.gameData.remainingTime < durations.placingBets) {
            this.bot && (await this.bot.run());
            this.runningRoundInfoPublisher.publish();
        }
    }

    async generateAndPublishShoe() {
        if (!this.isGeneratingResult) {
            try {
                this.isGeneratingResult = true;
                await this.roundResultConsumer.generateAndPublishHash();
            } catch (e) {
                this.logService.logError(e);
            } finally {
                this.isGeneratingResult = false;
            }

            const { isSufficient } = await this.roundResultConsumer.checkSufficientChain();
            return isSufficient;
        } else {
            return false;
        }
    }
}
