import { stub, stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { GameDefinition, Publishers, TableGameData } from "sc-card-game-base";
import { Core } from "sc-game-base";
import MultiplierCardsConsumer from "../../../src/consumers/multiplier-cards-consumer";
import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";

const roundResultPublisher = stub(Publishers.RoundResultPublisher);
const userBetResultPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);
const endGame = jest.fn();
const roundsRepository = stubMongoose(mongoose.Model);
const betsRepository = stubMongoose(mongoose.Model);
const resultsRepository = stubMongoose(mongoose.Model);
const multiplierCardsConsumer = stub(MultiplierCardsConsumer);
const definition = new GameDefinition({}, jest.fn(), jest.fn());
const gameData = new TableGameData();
const gameManagementApiClientFactory = {
    instance: jest.fn(),
};

describe("SettleGameRoundConsumer", () => {
    let consumer;

    beforeEach(() => {
        consumer = new SettleGameRoundConsumer({
            definition,
            gameData,
            roundResultPublisher,
            userBetResultPublisher,
            endGame,
            roundsRepository,
            betsRepository,
            gameManagementApiClientFactory,
            resultsRepository,
            multiplierCardsConsumer,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getOddsMultipliers", () => {
        describe("when applyMultiplier is false", () => {
            it("should return undefined", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = false;

                //Assert
                expect(consumer.getOddsMultipliers()).toBeUndefined();
            });
        });
        describe("when applyMultiplier is true", () => {
            it("should return multipliers", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = true;
                multiplierCardsConsumer.withdrawCards.mockReturnValueOnce([{ value: 1, suit: 0, rank: 10 }]);

                //Act
                const result = consumer.getOddsMultipliers();

                //Assert
                expect(result).toEqual([{ value: 1, suit: 0, rank: 10 }]);
            });
        });
    });

    describe("getAppliedMultipliers", () => {
        it("should handle no multipliers correctly", () => {
            gameData.gameConfigs.applyMultiplier = false;
            expect(consumer.getAppliedMultipliers([], {}, {})).toBeUndefined();
        });
    });
});
