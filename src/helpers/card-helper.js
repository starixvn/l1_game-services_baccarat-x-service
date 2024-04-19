export const getCardValue = (card) => {
    if (card == null) {
        return 0;
    }

    let cardValue = card.rank + 1;

    if (cardValue >= 10) {
        // Card 10, J, Q, K
        cardValue = 0;
    }

    return cardValue;
};
