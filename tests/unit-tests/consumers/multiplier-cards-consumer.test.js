import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { TableGameData } from "sc-card-game-base";
import MultiplierCardsConsumer from "../../../src/consumers/multiplier-cards-consumer";
const gameData = new TableGameData();
gameData.shoe = {};
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

const multipliersRepository = stubMongoose(mongoose.Model);

function initConsumer() {
    return new MultiplierCardsConsumer(gameData, multipliersRepository);
}

afterEach(() => {
    gameData.oddsMultipliers = undefined;
    jest.clearAllMocks();
});

describe("MultiplierCardsConsumer", () => {
    describe("generate", () => {
        it("should return amount of cards with multiplier value in config range", async () => {
            //Arrange
            const consumer = initConsumer();
            const { numberOfCardsRange, values } = gameConfigs.oddsMultipliers;

            //Act
            const multiplierCards = await consumer.generate();

            //Aseert
            expect(multiplierCards.length).toBeGreaterThanOrEqual(numberOfCardsRange.min);
            expect(multiplierCards.length).toBeLessThanOrEqual(numberOfCardsRange.max);
            expect(multiplierCards.every((x) => values.map((v) => v.number).includes(x.value))).toBeTrue();
        });

        it("should call multipliersRepository.create", async () => {
            //Arrange
            const consumer = initConsumer();

            //Act
            await consumer.generate();

            //Aseert
            expect(multipliersRepository.create).toHaveBeenCalled();
        });
    });

    describe("queryCurrentRoundMultiplierResult", () => {
        describe("when current round has generated multipliers", () => {
            it("should update to gameData.oddsMultiplieres", async () => {
                //Arrange
                gameData.roundId = 1;
                const multiplierCards = [{ rannk: 1, suit: 1, value: 3 }];
                multipliersRepository.findOne().lean().exec.mockReturnValueOnce({ roundId: gameData.roundId, cards: multiplierCards });

                const consumer = initConsumer();

                //Act
                await consumer.queryCurrentRoundMultiplierResult();

                //Assert
                expect(gameData.oddsMultipliers).toEqual(multiplierCards);
            });
        });

        describe("when current round has not generated multipliers", () => {
            it("do nothing", async () => {
                //Arrange
                gameData.roundId = 1;

                const consumer = initConsumer();

                //Act
                await consumer.queryCurrentRoundMultiplierResult();

                //Assert
                expect(gameData.oddsMultipliers).toBeUndefined();
            });
        });
    });
});
