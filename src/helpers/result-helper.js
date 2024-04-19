import BaccaratGame from "./baccarat-game";
import { getCardValue } from "./card-helper";

const generateResult = (shoe) => {
    const cards = [];
    const baccaratGame = new BaccaratGame([...cards]);
    let action = "";

    do {
        action = baccaratGame.getAction();
        baccaratGame[action]();
    } while (action !== BaccaratGame.Actions.finalComparison);

    const usedCardsCount = baccaratGame.player.getNumberOfCards() + baccaratGame.banker.getNumberOfCards();
    return { result: { player: baccaratGame.player, banker: baccaratGame.banker, cards: cards.slice(0, usedCardsCount) }, usedCardsCount };
};

const settlementRuleEntries = Object.entries({
    player: ({ player, banker }) => {
        const playerScore = getTotalScore(player);
        const bankerScore = getTotalScore(banker);
        return playerScore > bankerScore;
    },
    banker: ({ player, banker }) => {
        const playerScore = getTotalScore(player);
        const bankerScore = getTotalScore(banker);
        return playerScore < bankerScore;
    },
    tie: ({ player, banker }) => {
        const playerScore = getTotalScore(player);
        const bankerScore = getTotalScore(banker);
        return playerScore === bankerScore;
    },
    big: ({ player, banker }) => {
        const numberOfCards = getNumberOfCards(player) + getNumberOfCards(banker);
        return numberOfCards > 4;
    },
    small: ({ player, banker }) => {
        const numberOfCards = getNumberOfCards(player) + getNumberOfCards(banker);
        return numberOfCards === 4;
    },
    playerPair: ({ player, banker }) => hasPair(player),
    bankerPair: ({ player, banker }) => hasPair(banker),
    natural: ({ player, banker }) => {
        const numberOfCards = getNumberOfCards(player) + getNumberOfCards(banker);
        return numberOfCards === 4 && (getTotalScore(player) >= 8 || getTotalScore(banker) >= 8);
    },
});

const getTotalScore = (handResult) => {
    return Object.values(handResult).reduce((result, card) => {
        const cardValue = getCardValue(card);

        return (result + cardValue) % 10;
    }, 0);
};

const getNumberOfCards = (handResult) => {
    return Object.values(handResult).filter((card) => !!card).length;
};

const hasPair = (handResult) => {
    const { card1, card2 } = handResult;

    return card1.rank === card2.rank;
};

const getSettlementResult = (roundResult) => {
    return settlementRuleEntries.reduce((result, [choice, rule]) => {
        result[choice] = rule(roundResult);

        return result;
    }, {});
};

export { generateResult, getSettlementResult };

