import { Consumers } from "sc-card-game-base";
import { Helpers } from "sc-card-game-base";

export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, cutCardConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.cutCardConsumer = cutCardConsumer;
    }

    generateShoe(cardsFromAdmin, randomMode) {
        const { CardChain, CryptoHelper } = Helpers;
        const cards = CardChain.updateCards(CardChain.generateCards(8, randomMode), cardsFromAdmin);

        const shoeString = cards.map((card) => `${card.rank}${card.suit}`).toString();

        const rawValue = `${shoeString}_${CryptoHelper.randomString()}`;
        const hashValue = CryptoHelper.createHashSHA256(rawValue);
        const encryptedShoe = CryptoHelper.encrypt(rawValue);
        const encryptedShoeHash = CryptoHelper.encrypt(hashValue);

        return {
            cards,
            rawValue,
            hashValue,
            encryptedShoe,
            encryptedShoeHash,
        };
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
