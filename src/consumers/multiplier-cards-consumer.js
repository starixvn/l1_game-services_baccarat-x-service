import Chance from "chance";
import { Helpers } from "sc-card-game-base";

export default class MultiplierCardsConsumer {
    constructor(gameData, multipliersRepository) {
        this.gameData = gameData;
        this.chance = new Chance();
        this.multipliersRepository = multipliersRepository;
    }

    async generate() {
        const { randomMode, oddsMultipliers } = this.gameData.gameConfigs;
        const deck = Helpers.CardChain.generateCards(1, randomMode);
        const cards = deck.slice(
            0,
            this.chance.integer({ min: oddsMultipliers.numberOfCardsRange.min, max: oddsMultipliers.numberOfCardsRange.max })
        );

        for (const card of cards) {
            card.value = this.chance.weighted(
                oddsMultipliers.values.map((x) => x.number),
                oddsMultipliers.values.map((x) => x.ratio)
            );
        }

        await this.multipliersRepository.create({
            roundId: this.gameData.roundId,
            cards,
        });

        this.gameData.oddsMultipliers = cards;
        return cards;
    }

    async queryCurrentRoundMultiplierResult() {
        const currentRoundRecord = await this.multipliersRepository.findOne({ roundId: this.gameData.roundId }).lean().exec();

        if (currentRoundRecord) {
            this.gameData.oddsMultipliers = currentRoundRecord.cards;
        }
    }
}
