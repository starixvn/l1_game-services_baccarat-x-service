import BaccaratGame from "./baccarat-game";

const generateResult = (shoe) => {
    const { currentIndex } = shoe;
    const cards = shoe.cards.slice(currentIndex, currentIndex + 6);
    const baccaratGame = new BaccaratGame([...cards]);
    let action = "";

    do {
        action = baccaratGame.getAction();
        baccaratGame[action]();
    } while (action !== BaccaratGame.Actions.finalize);

    const usedCardsCount = baccaratGame.player.getNumberOfCards() + baccaratGame.banker.getNumberOfCards();
    return { result: { player: baccaratGame.player, banker: baccaratGame.banker }, usedCardsCount };
};

const settlementRuleEntries = Object.entries({
    player: ({ player, banker }) => player.score > banker.score,
    banker: ({ player, banker }) => player.score < banker.score,
    tie: ({ player, banker }) => player.score === banker.score,
    playerPair: ({ player }) => player.hasPair(),
    bankerPair: ({ banker }) => banker.hasPair(),
    natural: ({ player, banker }) => {
        const numberOfCards = player.getNumberOfCards() + banker.getNumberOfCards();
        return numberOfCards === 4 && (player.score >= 8 || banker.score >= 8);
    },
});

const getSettlementResult = (roundResult) => {
    return settlementRuleEntries.reduce((result, [choice, rule]) => {
        result[choice] = rule(roundResult);

        return result;
    }, {});
};

export { generateResult, getSettlementResult };

