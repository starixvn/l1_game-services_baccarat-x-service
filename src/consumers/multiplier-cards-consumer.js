import Chance from "chance";
import { Helpers } from "sc-card-game-base";

export default class MultiplierCardsConsumer {
    constructor(gameData) {
        this.gameData = gameData;
        this.chance = new Chance();
    }

    withdrawCards() {
        const { randomMode, oddsMultiplier } = this.gameData.gameConfigs;
        const deck = Helpers.CardChain.generateCards(1, randomMode);
        const cards = deck.slice(0, this.chance.integer({ min: oddsMultiplier.items.min, max: oddsMultiplier.items.max }));

        for (const card of cards) {
            card.value = this.chance.pickone(oddsMultiplier.values);
        }

        return cards;
    }
}
