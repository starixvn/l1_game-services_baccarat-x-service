import { TableGameData } from "sc-card-game-base";
import MultiplierCardsConsumer from "../../../src/consumers/multiplier-cards-consumer";

const gameData = new TableGameData();
const gameConfigs = {
    odds: {
        player: 2,
        banker: 1.95,
        tie: 9,
        playerPair: 12,
        bankerPair: 12,
    },
    applyMultiplier: true,
    maxWinPerRound: 3000,
    oddsMultipliers: {
        numberOfCardsRange: { min: 2, max: 6 },
        values: [
            { number: 2, ratio: 4 },
            { number: 4, ratio: 1 },
        ],
    },
};
gameData.gameConfigs = { ...gameConfigs };
describe("MultiplierCardsConsumer", () => {
    describe("withdrawCards", () => {
        it("should return amount of cards with multiplier value in config range", () => {
            //Arrange
            const consumer = new MultiplierCardsConsumer(gameData);
            const { numberOfCardsRange, values } = gameConfigs.oddsMultipliers;

            //Act
            const multiplierCards = consumer.withdrawCards();

            //Aseert
            expect(multiplierCards.length).toBeGreaterThanOrEqual(numberOfCardsRange.min);
            expect(multiplierCards.length).toBeLessThanOrEqual(numberOfCardsRange.max);
            expect(multiplierCards.every((x) => values.map((v) => v.number).includes(x.value))).toBeTrue();
        });
    });
});
