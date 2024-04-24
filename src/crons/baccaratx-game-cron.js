import { GameCron } from "sc-card-game-base/src/crons";

export default class BaccaratXGameCron extends GameCron {
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
    }
    async resetForNewRoundWhenChangingShoe() {
        const { isSufficient } = await this.roundResultConsumer.checkSufficientChain();
        if (!isSufficient) {
            // for changing shoe round, we reset data at the moment of changing shoe instead of doing reset at starting time like normal round
            // isSufficient = false: meaning changing shoe
            this.resetForNewRound();
            await this.cutCardConsumer.generateServerCutCardIndex();
        }
    }
}
