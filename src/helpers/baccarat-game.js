import BaccaratPlayer from "./baccarat-player";

const Actions = {
    receiveTwoCards: "receiveTwoCards",
    playerReceiveThirdCard: "playerReceiveThirdCard",
    bankerReceiveThirdCard: "bankerReceiveThirdCard",
    finalComparison: "finalComparison",
};

class BaccaratGame {
    constructor(cards) {
        this.player = new BaccaratPlayer();
        this.banker = new BaccaratPlayer();
        this.cards = cards;
    }

    receiveTwoCards() {
        this.player.card1 = this.cards.shift();
        this.banker.card1 = this.cards.shift();
        this.player.card2 = this.cards.shift();
        this.banker.card2 = this.cards.shift();
    }

    playerReceiveThirdCard() {
        const card = this.cards.shift();

        this.player.card3 = card;
    }

    bankerReceiveThirdCard() {
        const card = this.cards.shift();

        this.banker.card3 = card;
    }

    finalComparison() {
        const score = this.getTotalScore();
        const numberOfCards = this.player.getNumberOfCards() + this.banker.getNumberOfCards();

        return {
            player: score.player > score.banker,
            banker: score.player < score.banker,
            tie: score.player === score.banker,
            playerPair: this.player.hasPair(),
            bankerPair: this.banker.hasPair(),
            natural: numberOfCards === 4 && (score.player >= 8 || score.banker >= 8),
        };
    }

    getTotalScore() {
        return {
            player: this.player.getTotalScore(),
            banker: this.banker.getTotalScore(),
        };
    }

    getNumberOfCards() {
        return {
            player: this.player.getNumberOfCards(),
            banker: this.banker.getNumberOfCards(),
        };
    }

    getAction() {
        const numberOfCards = this.getNumberOfCards();
        const score = this.getTotalScore();

        if (numberOfCards.player < 2 || numberOfCards.banker < 2) {
            return Actions.receiveTwoCards;
        }

        if (numberOfCards.player === 2 && numberOfCards.banker === 2) {
            if (score.player >= 8 || score.banker >= 8) {
                return Actions.finalComparison;
            }

            if (score.player <= 5) {
                return Actions.playerReceiveThirdCard;
            }

            // Player score: 6 or 7
            if (score.banker <= 5) {
                return Actions.bankerReceiveThirdCard;
            }

            return Actions.finalComparison;
        }

        if (numberOfCards.player === 3 && numberOfCards.banker === 2) {
            const thirdCardOfPlayer = this.player.getThirdCardValue();
            const hasBankerReceiveThirdCard = this.checkBankerHasReceiveThirdCard(score, thirdCardOfPlayer);

            if (hasBankerReceiveThirdCard) {
                return Actions.bankerReceiveThirdCard;
            }

            return Actions.finalComparison;
        }

        return Actions.finalComparison;
    }

    checkBankerHasReceiveThirdCard(score, thirdCardOfPlayer) {
        return (
            score.banker <= 2 ||
            (score.banker === 3 && thirdCardOfPlayer !== 8) ||
            (score.banker === 4 && thirdCardOfPlayer >= 2 && thirdCardOfPlayer <= 7) ||
            (score.banker === 5 && thirdCardOfPlayer >= 4 && thirdCardOfPlayer <= 7) ||
            (score.banker === 6 && thirdCardOfPlayer >= 6 && thirdCardOfPlayer <= 7)
        );
    }
}

BaccaratGame.Actions = Actions;

export default BaccaratGame;
