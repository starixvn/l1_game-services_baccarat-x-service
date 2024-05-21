import Chance from "chance";
import { Helpers } from "sc-card-game-base";

export default class MultiplierCardsConsumer {
    constructor(gameData) {
        this.gameData = gameData;
        this.chance = new Chance();
    }

    withdrawCards() {
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

        return cards;
    }
}
