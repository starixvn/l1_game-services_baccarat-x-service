import Chance from "chance";
import { Helpers } from "sc-card-game-base";

export default class MultiplierCardsConsumer {
    constructor(gameData) {
        this.gameData = gameData;
        this.chance = new Chance();
    }

    withdrawCards() {
        const { randomMode, oddsMultiplier } = this.gameData.gameConfigs;
        const deck = this.shuffle(Helpers.CardChain.generateCards(1, randomMode));
        const cards = deck.slice(0, this.chance.integer({ min: oddsMultiplier.items.min, max: oddsMultiplier.items.max }));

        for (let card of cards) {
            card.multiplier = this.chance.pickone(oddsMultiplier.values);
        }

        return cards;
    }

    shuffle(deck) {
        return this.chance.shuffle(this.chance.shuffle(this.chance.shuffle(deck)));
    }
}
