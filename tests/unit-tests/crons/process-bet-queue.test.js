import { TableGameData } from "sc-card-game-base";
import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import BaccaratGameDefinition from "../../../src/game-definition";

const definition = new BaccaratGameDefinition({});
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
        extraFeeRatio: 0.2,
    },
};
const gameManagementApiClientFactory = {
    instance: jest.fn(),
};

let processBetQueue;

beforeEach(() => {
    gameData.gameConfigs = { ...gameConfigs };
    processBetQueue = new ProcessBetQueue({ definition, gameData, gameManagementApiClientFactory });
});

describe("ProcessBetQueue", () => {
    describe("formatApiBetInfo", () => {
        describe("when gameConfigs.applyMultiplier is true", () => {
            it("should add fee to amount", () => {
                //Arrange
                const payload = {
                    amount: 100,
                    betChoice: "player",
                };

                //Act
                const result = processBetQueue.formatApiBetInfo(payload);

                //Assert
                expect(result.amount).toEqual(payload.amount + payload.amount * gameConfigs.oddsMultipliers.extraFeeRatio);
            });
        });
        describe("when gameConfigs.applyMultiplier is false", () => {
            it("shouldnt add fee to amount", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = false;
                const payload = {
                    amount: 100,
                    betChoice: "player",
                };

                //Act
                const result = processBetQueue.formatApiBetInfo(payload);

                //Assert
                expect(result.amount).toEqual(payload.amount);
            });
        });
    });
});
