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
        const cards = deck.slice(0, this.chance.integer({ min: oddsMultiplier.cardNumber.min, max: oddsMultiplier.cardNumber.max }));

        for (const card of cards) {
            card.value = this.chance.weighted(
                oddsMultiplier.values.map((x) => x.number),
                oddsMultiplier.values.map((x) => x.ratio)
            );
        }

        return cards;
    }
}
