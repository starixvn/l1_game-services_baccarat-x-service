import { generateResult } from "../../../src/helpers/result-helper";

describe("generateResult", () => {
    it("should draw maximum 6 cards", () => {
        //Arrange
        const shoe = {
            currentIndex: 0,
            cards: [
                { rank: 10, suit: 1 },
                { rank: 6, suit: 3 },
                { rank: 11, suit: 0 },
                { rank: 4, suit: 0 },
                { rank: 3, suit: 0 },
                { rank: 2, suit: 0 },
                { rank: 8, suit: 0 },
            ],
        };

        //Act
        const { usedCardsCount } = generateResult(shoe);
        //Assert
        expect(usedCardsCount).toBeLessThanOrEqual(6);
    });

    it("the result should have player & banker cards", () => {
        //Arrange
        const shoe = {
            currentIndex: 0,
            cards: [
                { rank: 10, suit: 1 },
                { rank: 6, suit: 3 },
                { rank: 11, suit: 0 },
                { rank: 4, suit: 0 },
                { rank: 3, suit: 0 },
                { rank: 2, suit: 0 },
                { rank: 8, suit: 0 },
            ],
        };

        //Act
        const { result } = generateResult(shoe);
        //Assert
        expect(result.player.getCards()).not.toBeEmpty();
        expect(result.banker.getCards()).not.toBeEmpty();
    });
});
