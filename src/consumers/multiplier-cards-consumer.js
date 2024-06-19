import Chance from "chance";
import { Helpers } from "sc-card-game-base";

export default class MultiplierCardsConsumer {
    constructor(gameData, multipliersRepository) {
        this.gameData = gameData;
        this.chance = new Chance();
        this.multipliersRepository = multipliersRepository;
    }

    async generate() {
        let multiplierCards = [];

        if (this.gameData.shoe.presetMultiplierCards) {
            multiplierCards = this.gameData.shoe.presetMultiplierCards;
        } else {
            const { randomMode, oddsMultipliers } = this.gameData.gameConfigs;
            const deck = Helpers.CardChain.generateCards(1, randomMode);

            multiplierCards = deck.slice(
                0,
                this.chance.integer({ min: oddsMultipliers.numberOfCardsRange.min, max: oddsMultipliers.numberOfCardsRange.max })
            );

            for (const card of multiplierCards) {
                card.value = this.chance.weighted(
                    oddsMultipliers.values.map((x) => x.number),
                    oddsMultipliers.values.map((x) => x.ratio)
                );
            }
        }

        await this.multipliersRepository.create({
            roundId: this.gameData.roundId,
            cards: multiplierCards,
        });

        this.gameData.oddsMultipliers = multiplierCards;
        return multiplierCards;
    }

    async queryCurrentRoundMultiplierResult() {
        const currentRoundRecord = await this.multipliersRepository.findOne({ roundId: this.gameData.roundId }).lean().exec();

        if (currentRoundRecord) {
            this.gameData.oddsMultipliers = currentRoundRecord.cards;
        }
    }
}
