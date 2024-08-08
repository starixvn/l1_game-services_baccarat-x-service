import { Helpers } from "sc-card-game-base";

const getSuitIndex = (suit) => Helpers.CardData.suit.findIndex((s) => s === suit);
const getRankIndex = (rank) => Helpers.CardData.name.findIndex((r) => r === rank);

const getCardValue = (card) => {
    if (!card) {
        return 0;
    }

    let cardValue = card.rank + 1;

    if (cardValue >= 10) {
        cardValue = 0;
    }

    return cardValue;
};

const getCardFromString = (card) => {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);

    return {
        rank: getRankIndex(rank),
        suit: getSuitIndex(suit),
    };
};

export { getCardValue, getCardFromString };
