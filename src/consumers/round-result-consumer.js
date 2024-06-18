import Chance from "chance";
import { Consumers } from "sc-card-game-base";

export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, cutCardConsumer, shoeConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.cutCardConsumer = cutCardConsumer;
        this.shoeConsumer = shoeConsumer;
        this.chance = new Chance();
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
        await this.resultsRepository.updateOne(
            { isAvailable: true },
            { $set: { isAvailable: false, lastRoundId: this.gameData.roundId - 1 } }
        );
    }

    async createResultRecord() {
        const { randomMode } = this.gameData.gameConfigs;
        const { cardsFromAdmin } = this.getResultFromAdmin();
        const shoe = this.shoeConsumer.generateShoe(cardsFromAdmin, randomMode);
        const { encryptedShoe, encryptedShoeHash, cards, rawValue, hashValue } = shoe;
        const burnedCards = this.calculateBurnedCards(shoe.cards);
        const serverCutCardIndex = await this.cutCardConsumer.generateServerCutCardIndex();

        const record = {
            isAvailable: true,
            currentIndex: burnedCards,
            burnedCards: burnedCards,
            remainingCards: 0,
            shoe: { encryptedShoe, encryptedShoeHash },
            firstRoundId: this.gameData.roundId,
            cutCardIndex: serverCutCardIndex,
        };

        await this.resultsRepository.create(record);

        return { cards, currentIndex: burnedCards, burnedCards, rawValue, hashValue, firstRoundId: record.firstRoundId };
    }

    calculateBurnedCards(cards) {
        const firstCard = cards[0];
        const cardValue = firstCard.rank >= 10 ? 10 : firstCard.rank + 1;
        return cardValue + 1;
    }

    async checkSufficientChain() {
        let isSufficient = false;
        const shoe = await this.resultsRepository
            .findOne({ isAvailable: true }, null, { sort: { time: -1 } })
            .lean()
            .exec();

        if (
            !this.hasResultFromAdmin() &&
            shoe &&
            (shoe.currentIndex < shoe.cutCardIndex || (shoe.currentIndex === shoe.cutCardIndex && shoe.remainingCards !== 0))
        ) {
            isSufficient = true;
        }

        return { shoe, isSufficient };
    }

    async updateAndPublishFinalCutCardIndex() {
        const cutCardIndex = await this.cutCardConsumer.calculateCutCardIndex();
        this.gameData.shoe.cutCardIndex = cutCardIndex;

        this.roundResultPublisher.publishFinalCutCardIndex();

        await this.resultsRepository.updateOne({ firstRoundId: this.gameData.roundId, isAvailable: true }, { $set: { cutCardIndex } });
    }
}
