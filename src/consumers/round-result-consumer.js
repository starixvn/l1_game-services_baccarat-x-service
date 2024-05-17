import { Consumers } from "sc-card-game-base";
import { Helpers } from "sc-card-game-base";

export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, cutCardConsumer, shoeConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.cutCardConsumer = cutCardConsumer;
        this.shoeConsumer = shoeConsumer;
    }

    async generateAndPublishHash() {
        const { isSufficient } = await this.checkSufficientChain();
        if (!isSufficient) {
            await this.setUnavailable();
            this.gameData.shoe = await this.createResultRecord();
            this.gameData.settlementResultFromAdmin = {};
            this.roundResultPublisher.publishNewShoeHash();
        }
    }

    async setUnavailable() {
        await this.resultsRepository.update(
            { isAvailable: true },
            { $set: { isAvailable: false, lastRoundId: this.gameData.roundId - 1 } }
            //{ multi: true }
        );
    }

    async createResultRecord() {
        const { randomMode } = this.gameData.gameConfigs;
        const { cardsFromAdmin } = this.getResultFromAdmin();
        const shoe = this.shoeConsumer.generateShoe(cardsFromAdmin, randomMode);
        const { encryptedShoe, encryptedShoeHash, cards } = shoe;
        const burnedCards = this.calculateBurnedCards(cardChain.chain);

        const record = {
            isAvailable: true,
            currentIndex: burnedCards,
            burnedCards: burnedCards,
            remainingCards: 0,
            shoe: { encryptedShoe, encryptedShoeHash },
            firstRoundId: this.gameData.roundId,
        };

        await this.resultsRepository.create(record);

        return { encryptedShoe, encryptedShoeHash, cards, currentIndex: burnedCards };
    }
}
