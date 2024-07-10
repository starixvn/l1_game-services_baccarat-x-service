import { helpers } from "sc-common";
import { Table } from "sc-game-base";
import constants from "../constants";

export default class BaccaratXBot extends Table.Crons.TableGameBot {
    constructor(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository, cutCardConsumer) {
        super(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository);
        this.cutCardConsumer = cutCardConsumer;

        this.betChoiceRatio = { PlayerBanker: 95, PlayerBankerPair: 2, Tie: 3 };
        this.playerBankerOpts = ["player", "banker"];
        this.playerBankerPairOpts = ["playerPair", "bankerPair"];
        this.tieOpts = ["tie"];
        this.botCutCardRatio = 0.2;
    }

    async contributeCutCard(bot) {
        const { minCutCardIndex, maxCutCardIndex } = this.definition;
        const cutCardIndex = this.chance.integer({ min: minCutCardIndex, max: maxCutCardIndex });

        await this.cutCardConsumer.insertPlayerCutCard(bot.name, cutCardIndex);
    }

    getBotsToCutCard() {
        const totalBotInRoom = Object.keys(this.botsInRoom).length;
        const minBotCutCard = Math.min(totalBotInRoom, 5);
        const numberBotsCutCard = this.chance.integer({ min: minBotCutCard, max: totalBotInRoom });

        let botsCutCard = Object.values(this.botsInRoom);

        botsCutCard = this.chance.shuffle(botsCutCard);

        return botsCutCard.slice(0, numberBotsCutCard);
    }

    async startBotCutCard() {
        const botsCutCard = this.getBotsToCutCard();

        await Promise.all(botsCutCard.map((bot) => this.contributeCutCard(bot)));
    }

    resetAllBotData() {
        super.resetAllBotData();
        this.resetAllBets();
    }

    resetAllBets() {
        this.allBets = {
            player: 0,
            banker: 0,
            tie: 0,
            playerPair: 0,
            bankerPair: 0,
        };

        this.smallTickets = 0;
    }

    getBetChoice(bot) {
        const totalBotBet = this.getAllBetAmount();

        const betChoiceRatios = [
            {
                group: this.playerBankerOpts,
                underBetRatio:
                    (this.getTotalAmountOnChoiceGroup(this.playerBankerOpts) * 100) / totalBotBet < this.betChoiceRatio.PlayerBanker,
            },
            {
                group: this.playerBankerPairOpts,
                underBetRatio:
                    (this.getTotalAmountOnChoiceGroup(this.playerBankerPairOpts) * 100) / totalBotBet <
                    this.betChoiceRatio.PlayerBankerPair,
            },
            {
                group: this.tieOpts,
                underBetRatio: (this.getTotalAmountOnChoiceGroup(this.tieOpts) * 100) / totalBotBet < this.betChoiceRatio.Tie,
            },
        ];

        const underRatioGroups = helpers.arrayHelper.shuffle(betChoiceRatios.filter((data) => data.underBetRatio));

        const choice =
            underRatioGroups.length > 0
                ? this.getRandomChoiceFromGroup(underRatioGroups[0].group)
                : this.getRandomChoiceFromGroup(this.playerBankerOpts);

        const previousUniqueChoices = bot.choices.filter((betChoice) => this.playerBankerOpts.includes(betChoice));

        return previousUniqueChoices.length > 0 ? previousUniqueChoices[0] : choice;
    }

    getMaxBet(bot, choice) {
        const gameConfigs = this.gameData.gameConfigs;
        const minBet = this.getMinBet();
        const maxBetPerChoice = gameConfigs.choices_maxbet[choice];
        const botMaxBet = gameConfigs.bot_maxbet;
        const maxBet = Math.min(maxBetPerChoice, botMaxBet);

        if (this.playerBankerOpts.includes(choice)) {
            const isSmallTicket = this.totalTickets === 0 ? true : (this.smallTickets * 100) / this.totalTickets < this.smallTicketRatio;
            const maxBetOfSmallTicket = Math.min(minBet * 50, botMaxBet * 0.3);
            return isSmallTicket ? maxBetOfSmallTicket : maxBet;
        }

        return Math.min(minBet * 50, maxBet * 0.2);
    }

    getRandomChoiceFromGroup(group) {
        return this.chance.pickone(group);
    }

    getTotalAmountOnChoiceGroup(choices) {
        let total = 0;
        choices.forEach((choice) => (total += this.allBets[choice]));

        return total;
    }

    getTotalAmountOfBotOnChoiceGroup(bot, choices) {
        let total = 0;
        choices.forEach((choice) => (total += bot.betOnChoices[choice]));

        return total;
    }

    getAllBetAmount() {
        let total = 0;
        this.definition.choices.forEach((choice) => (total += this.allBets[choice]));

        return total;
    }

    isSmallTicket(amount) {
        return amount <= this.getMinBet() * 50;
    }

    updateBotInRoomData(bot, choice, amount, balance) {
        super.updateBotInRoomData(bot, choice, amount, balance);

        this.allBets[choice] = this.allBets[choice] ? this.allBets[choice] + amount : amount;
        this.smallTickets += this.isSmallTicket(amount) ? 1 : 0;
    }

    convertAmountToChip(amount) {
        const chipList = constants.chips.filter((chip) => amount / chip >= 1);

        return chipList.length > 0 ? chipList[0] : this.getMinBet();
    }

    getBotsToBet() {
        const maxTickets = Math.floor(Object.keys(this.botsInRoom).length / this.gameData.remainingTime) + 5;
        const numberBotsToBet = this.chance.integer({ min: 5, max: maxTickets });

        let botsToBet = Object.values(this.botsInRoom).filter(
            (t) => t.totalBet < this.gameData.gameConfigs.bot_maxbet && t.remainTickets > 0
        );

        botsToBet = this.chance.shuffle(botsToBet);

        return botsToBet.slice(0, Math.min(numberBotsToBet, botsToBet.length));
    }

    shouldAddBot(random) {
        return random === this.inOutValues.in && Object.keys(this.botsInRoom).length < this.maxNumberOfBots;
    }

    updateBalanceAndPublishBetPayload(botId, choice, amount, balance) {
        if (this.definition.commonChoices.includes(choice)) {
            if (!this.gameData.betUserCount[choice]) {
                this.gameData.betUserCount[choice] = [];
            }
            this.gameData.betUserCount[choice].push(botId);
        }

        super.updateBalanceAndPublishBetPayload(botId, choice, amount, balance);
    }

    async insertOrUpdateBet(bot, choice, amount, currentBet) {
        const { maxWinPerRound, bot_maxbet } = this.gameData.gameConfigs;

        const currentAmount = currentBet ? currentBet[choice] : 0;
        const update = { [choice]: amount + currentAmount };
        const create = {
            uid: bot.id,
            name: bot.name,
            roundId: this.gameData.roundId,
            time: new Date(),
            currency: " ",
            operatorId: " ",
            clientSeed: bot.clientSeed,
            maxWin: maxWinPerRound * bot_maxbet,
        };

        await this.tempBetsRepository.updateOne(
            { uid: bot.id, roundId: this.gameData.roundId },
            { $set: update, $setOnInsert: create },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return create.time;
    }
}
