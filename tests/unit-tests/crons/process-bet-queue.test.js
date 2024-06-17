import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { TableGameData } from "sc-card-game-base";
import BaccaratGameDefinition from "../../../src/baccarat-game-definition";
import ProcessBetQueue from "../../../src/crons/process-bet-queue";

const definition = new BaccaratGameDefinition({});
const gameData = new TableGameData();
gameData.currencyGroupGames = [{ groupId: "111", maxBet: 2000 }];

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

const betsRepository = stubMongoose(mongoose.Model);
const betLogsRepository = stubMongoose(mongoose.Model);

let processBetQueue;

beforeEach(() => {
    gameData.gameConfigs = { ...gameConfigs };
    processBetQueue = new ProcessBetQueue({ definition, gameData, gameManagementApiClientFactory, betsRepository, betLogsRepository });
});

describe("ProcessBetQueue", () => {
    describe("formatApiBetInfo", () => {
        it("should add fee to amount", () => {
            //Arrange
            const payload = {
                amount: 100,
                betChoice: "player",
                fee: 20,
            };

            //Act
            const result = processBetQueue.formatApiBetInfo(payload);

            //Assert
            expect(result.amount).toEqual(payload.amount + payload.fee);
        });
    });

    describe("setExtraFee", () => {
        describe("when gameConfigs.applyMultiplier is true", () => {
            it("Fee should be greater than 0", () => {
                //Arrange
                const payload = {
                    amount: 100,
                    betChoice: "player",
                };

                //Act
                const result = processBetQueue.setExtraFee(payload);

                //Assert
                expect(result).toEqual(payload.amount * gameConfigs.oddsMultipliers.extraFeeRatio);
            });
        });

        describe("when gameConfigs.applyMultiplier is false", () => {
            it("Fee should be  0", () => {
                gameData.gameConfigs.applyMultiplier = false;
                //Arrange
                const payload = {
                    amount: 100,
                    betChoice: "player",
                };

                //Act
                const result = processBetQueue.setExtraFee(payload);

                //Assert
                expect(result).toEqual(0);
            });
        });
    });
    describe("upsertBet", () => {
        const player = {
            session: { currencyGroupId: "111" },
            profile: {
                name: "player01",
                maxBet: 2000,
            },
        };
        describe("when gameConfigs.applyMultiplier is true", () => {
            it("Should update fee & tototal amount", async () => {
                //Arrange
                const bet = {
                    amount: 100,
                    betChoice: "player",
                    fee: 20,
                };

                //Act
                await processBetQueue.upsertBet(player, 1, bet, 1);

                //Assert
                expect(betsRepository.updateOne.mock.calls[0][1].$inc).toEqual({
                    fee: 20,
                    player: 100,
                    totalAmount: 120,
                    amount: bet.amount,
                });
            });
        });
    });

    describe("insertBetLog", () => {
        const player = {
            session: {},
            profile: {
                name: "player01",
            },
        };

        it("Should set fee equal to bet.fee", async () => {
            //Arrange
            const bet = {
                amount: 100,
                betChoice: "player",
                fee: 20,
            };

            //Act
            await processBetQueue.insertBetLog(player, 1, bet, 1);

            //Assert
            expect(betLogsRepository.create.mock.calls[0][0].fee).toEqual(bet.fee);
        });
    });

    describe("adjustOwnBets", () => {
        it("should update fee in ownbets", () => {
            //Arrange
            const playerName = "player01";
            gameData.ingame[playerName] = {};
            const bet = {
                amount: 100,
                betChoice: "player",
                fee: 20,
            };
            //Act
            processBetQueue.adjustOwnBets(playerName, bet);

            expect(gameData.ingame[playerName].ownBets.fee).toEqual(bet.fee);
        });
    });
});
