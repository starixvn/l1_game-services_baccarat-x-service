import Chance from "chance";

export default class CutCardConsumer {
    constructor(gameData, definition, publisher, cutCardPFRepository, logService) {
        this.gameData = gameData;
        this.definition = definition;
        this.publisher = publisher;
        this.cutCardPFRepository = cutCardPFRepository;
        this.logService = logService;
        this.chance = new Chance();
    }

    async validatePlayerCutCard(cutCard, playerName) {
        const { cutCardIndex } = cutCard;

        const isValidTime = this.validateCutCardTime();
        const isValidValue = this.validateCutCardIndex(cutCardIndex);

        return isValidTime && isValidValue && !(await this.validateExistingCutCard(playerName));
    }

    async validateExistingCutCard(playerName) {
        const { roundId } = this.gameData;

        await this.cutCardPFRepository.exists({ roundId, "playerCutCards.name": playerName });
    }

    validateCutCardTime() {
        const { remainingTime } = this.gameData;
        const { durations } = this.definition;

        return remainingTime > durations.generatingCutCardIndex && remainingTime < durations.generatingShoe;
    }

    validateCutCardIndex(cutCardIndex) {
        const { minCutCardIndex, maxCutCardIndex } = this.definition;

        return cutCardIndex >= minCutCardIndex && cutCardIndex <= maxCutCardIndex;
    }

    async consume(player, payload) {
        try {
            const { cutCardIndex } = payload;
            const playerName = player.profile.name;
            if (await this.validatePlayerCutCard(payload)) {
                await this.insertPlayerCutCard(playerName, cutCardIndex);

                this.publisher.publishToUser(player.UID, { cutCard: { successful: true, cutCardIndex } });

                return;
            }
        } catch (err) {
            this.logService.logError(err);
        }

        this.publisher.publishToUser(player.UID, { cutCard: { successful: false } });
    }

    async insertPlayerCutCard(name, clientSeed) {
        const { roundId } = this.gameData;

        await this.cutCardPFRepository.updateOne(
            { roundId },
            {
                $addToSet: { playerCutCards: { name, clientSeed, time: new Date() } },
            }
        );
    }

    async generateServerCutCardIndex() {
        const { roundId } = this.gameData;
        const { minCutCardIndex, maxCutCardIndex } = this.definition;
        const serverCutCardIndex = this.chance.integer({ min: minCutCardIndex, max: maxCutCardIndex });

        await this.cutCardPFRepository.create({ roundId, serverCutCardIndex, time: new Date(), playerCutCards: [] });

        return serverCutCardIndex;
    }

    async calculateCutCardIndex() {
        const { roundId } = this.gameData;
        const { serverCutCardIndex, playerCutCards } = await this.cutCardPFRepository.findOne({ roundId }).lean().exec();

        const averageCutIndex =
            playerCutCards.reduce((total, cur) => total + cur.clientSeed, serverCutCardIndex) / (playerCutCards.length + 1);

        return Math.floor(averageCutIndex);
    }
}
