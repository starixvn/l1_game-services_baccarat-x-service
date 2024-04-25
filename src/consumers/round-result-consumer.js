import Chance from "chance";
import { Consumers } from "sc-card-game-base";
import { Core } from "sc-game-base";
export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, provablyFairConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.provablyFairConsumer = provablyFairConsumer;
    }

    async generateServerSeedAndPublishHash() {
        const serverSeed = this.generateServerSeed();
        const serverSeedHash = Core.Helpers.SeedHelper.getSHA256Hash(serverSeed);

        this.provablyFairConsumer.setServerSeed(serverSeed);
        this.provablyFairConsumer.setServerSeedHash(serverSeedHash);

        await this.createResultRecord(serverSeed, serverSeedHash);

        this.roundResultPublisher.publishServerSeedHash();
    }

    generateServerSeed() {
        const chance = new Chance();
        const { minCutCardIndex, maxCutCardIndex } = this.definition;

        return chance.integer({ min: minCutCardIndex, max: maxCutCardIndex });
    }

    async createResultRecord(serverSeed, serverSeedHash) {
        await this.resultsRepository.create({
            roundId: this.gameData.roundId,
            serverSeedHash: serverSeedHash,
            serverSeed: serverSeed,
            time: new Date(),
        });
    }
}
