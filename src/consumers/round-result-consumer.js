import { Consumers } from "sc-card-game-base";
import { generateShoe } from "../helpers";
export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, cutCardConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.cutCardConsumer = cutCardConsumer;
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

    async createResultRecord() {
        const { randomMode } = this.gameData.gameConfigs;
        const { cardsFromAdmin } = this.getResultFromAdmin();
        const shoe = generateShoe(cardsFromAdmin, randomMode);
        const { encryptedShoe, encryptedShoeHash, cards } = shoe;
        const burnedCards = this.calculateBurnedCards(cardChain.chain);

        const record = {
            isAvailable: true,
            currentIndex: burnedCards,
            cutCardIndex: undefined,
            burnedCards: burnedCards,
            remainingCards: 0,
            shoe: { encryptedShoe, encryptedShoeHash },
            firstRoundId: this.gameData.roundId,
        };

        await this.resultsRepository.create(record);

        return { encryptedShoe, encryptedShoeHash, cards, currentIndex: burnedCards };
    }
}
