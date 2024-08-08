import { getCardValue } from "./card-helper";

export default class BaccaratPlayer {
    constructor() {
        this.card1 = null;
        this.card2 = null;
        this.card3 = null;
        this.score = 0;
    }

    getTotalScore() {
        return [this.card1, this.card2, this.card3].reduce((result, card) => {
            const cardValue = getCardValue(card);

            return (result + cardValue) % 10;
        }, 0);
    }

    updateScore() {
        this.score = this.getTotalScore();
    }

    getThirdCardValue() {
        return getCardValue(this.card3);
    }

    getNumberOfCards() {
        return [this.card1, this.card2, this.card3].filter((card) => !!card).length;
    }

    hasPair() {
        return this.card1.rank === this.card2.rank;
    }

    getCards() {
        if (this.card3) {
            return [this.card1, this.card2, this.card3];
        }

        return [this.card1, this.card2];
    }

    getFirst2Cards() {
        return [this.card1, this.card2];
    }
}
