import Chance from "chance";

export default class CutCardConsumer {
    constructor(gameData, definition, publisher, cutCardPFRepository, logService) {
        this.gameData = gameData;
        this.definition = definition;
        this.publisher = publisher;
        this.cutCardPFRepository = cutCardPFRepository;
        this.logService = logService;
    }

    validatePlayerCutCard(cutCard) {
        const { cutCardIndex } = cutCard;
        const { minCutCardIndex, maxCutCardIndex, durations } = this.definition;
        const { remainingTime } = this.gameData;

        return (
            remainingTime > durations.wholeRound + durations.cutCard && cutCardIndex >= minCutCardIndex && cutCardIndex <= maxCutCardIndex
        );
    }

    async consume(player, payload) {
        try {
            const { cutCardIndex } = payload;
            if (validatePlayerCutCard(payload)) {
                await this.insertPlayerCutCard(player.profile.name, cutCardIndex);

                this.publisher.publishToUser(player.UID, { cutCard: { successful: true, cutCardIndex } });

                return;
            }
        } catch (err) {
            this.logService.logError(error);
        }

        this.publisher.publishToUser(player.UID, { cutCard: { successful: false, errorCode: "SB19xx" } });
    }

    async insertPlayerCutCard(name, cutIndex) {
        const { roundId } = this.gameData;

        await this.cutCardPFRepository.updateOne(
            { roundId },
            {
                $addToSet: { playerCutCards: { name, cutIndex, time: new Date() } },
            }
        );
    }

    async generateServerCutCardIndex() {
        const { minCutCardIndex, maxCutCardIndex } = this.definition;
        const chance = new Chance();
        const serverCutCardIndex = chance.integer({ min: minCutCardIndex, max: maxCutCardIndex });

        await this.cutCardPFRepository.create({ roundId, serverCutCardIndex, time: new Date(), playerCutCards: [] });

        return serverCutCardIndex;
    }

    async calculateCutCardIndex() {
        const { roundId } = this.gameData;
        const { serverCutCardIndex, playerCutCards } = await this.cutCardPFRepository.findOne({ roundId }).lean().exec();

        const averageCutIndex = playerCutCards.reduce((total, cur) => total + cur, serverCutCardIndex) / (playerCutCards.length + 1);

        return Math.floor(averageCutIndex);
    }
}
