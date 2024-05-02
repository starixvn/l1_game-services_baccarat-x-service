import { Consumers } from "sc-card-game-base";
export default class RoundResultConsumer extends Consumers.RoundResultConsumer {
    constructor(gameData, definition, roundResultPublisher, resultsRepository, logService, cutCardConsumer) {
        super(gameData, definition, roundResultPublisher, resultsRepository, logService);
        this.cutCardConsumer = cutCardConsumer;
    }

    async createResultRecord() {
        const { randomMode } = this.gameData.gameConfigs;
        const { cardsFromAdmin, cutCardIndexFromAdmin } = this.getResultFromAdmin();
        const cardChain = generateChain(this.definition.numberOfDecks, cardsFromAdmin, randomMode);
        const burnedCards = this.calculateBurnedCards(cardChain.chain);

        const isCutCardIndexValid =
            cutCardIndexFromAdmin > 0 && cutCardIndexFromAdmin < cardChain.chain.length - this.definition.maxCardsPerRound;
        const cutCardIndex = isCutCardIndexValid ? cutCardIndexFromAdmin : await this.cutCardConsumer.calculateCutCardIndex();

        const record = {
            isAvailable: true,
            currentIndex: burnedCards,
            cutCardIndex: cutCardIndex,
            burnedCards: burnedCards,
            remainingCards: 0,
            chain: cardChain.chain,
            firstRoundId: this.gameData.roundId,
        };

        return this.resultsRepository.create(record);
    }
}
