import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { TableGameData } from "sc-card-game-base";
import { ReBetProcessor } from "sc-rebet-mode/src/crons";
import BaccaratGameDefinition from "../../../src/baccarat-game-definition";
import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import gameSettings from "../../../src/game-settings.js";

const definition = new BaccaratGameDefinition(gameSettings[0]);
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
const rebetProcessor = new ReBetProcessor();

let processBetQueue;

beforeEach(() => {
    gameData.gameConfigs = { ...gameConfigs };
    processBetQueue = new ProcessBetQueue({
        definition,
        gameData,
        gameManagementApiClientFactory,
        betsRepository,
        betLogsRepository,
        rebetProcessor,
    });
});

afterEach(() => {
    jest.clearAllMocks();
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
        describe("normal bet", () => {
            it("Should update fee & total amount", async () => {
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

        describe("rebet", () => {
            it("Should update amount of all choices", async () => {
                //Arrange
                const bet = {
                    rebet: true,
                    amount: 100,
                    fee: 20,
                    lastBet: {
                        player: 100,
                        playerPair: 20,
                    },
                };

                //Act
                await processBetQueue.upsertBet(player, 1, bet, 1);

                //Assert
                console.log(betsRepository.updateOne.mock.calls[0][1]);
                expect(betsRepository.updateOne.mock.calls[0][1].$inc).toEqual({
                    fee: 20,
                    player: 100,
                    playerPair: 20,
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
        describe("normal bet", () => {
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
                expect(betLogsRepository.insertMany.mock.calls[0][0][0].fee).toEqual(bet.fee);
            });
        });

        describe("rebet bet", () => {
            it("Should create bet log for each choice", async () => {
                //Arrange
                const bet = {
                    rebet: true,
                    amount: 100,
                    fee: 20,
                    lastBet: {
                        player: 80,
                        playerPair: 20,
                    },
                };

                //Act
                await processBetQueue.insertBetLog(player, 1, bet, 1);

                //Assert
                expect(betLogsRepository.insertMany.mock.calls[0][0].length).toEqual(2);
            });
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

    describe("adjustTotalBets", () => {
        afterEach(() => {
            gameData.totalBets = {};
            gameData.betUserCount = {};
        });

        const player = { UID: "123" };

        describe("rebet", () => {
            it("should update bet user count on common choices of rebet", () => {
                //Arrange
                const bet = {
                    rebet: true,
                    lastBet: {
                        player: 100,
                        playerPair: 50,
                    },
                };

                //Act
                processBetQueue.adjustTotalBets(player, bet, 1);

                //Assert
                expect(gameData.betUserCount.player.length).toEqual(1);
                expect(gameData.betUserCount.playerPair).toBeUndefined();
            });
        });

        describe("normal bet", () => {
            it("should update bet user count on common choice", () => {
                //Arrange
                const bet = {
                    amount: 100,
                    betChoice: "player",
                };

                //Act
                processBetQueue.adjustTotalBets(player, bet, 1);

                //Assert
                expect(gameData.betUserCount.player.length).toEqual(1);
            });

            it("should not update bet user count on uncommon choice", () => {
                //Arrange
                const bet = {
                    amount: 100,
                    betChoice: "playerPair",
                };

                //Act
                processBetQueue.adjustTotalBets(player, bet, 1);

                //Assert
                expect(gameData.betUserCount.playerPair).toBeUndefined();
            });
        });
    });

    describe("generatePlacingBetResult", () => {
        it("should add fee to endBet", () => {
            //Arrange
            const player = { profile: { name: "player01" } };
            const bet = {
                amount: 100,
                betChoice: "player",
                fee: 20,
            };

            //Act
            const result = processBetQueue.generatePlacingBetResult(player, {}, bet, 1);

            //Assert
            expect(result.endBet).toEqual(120);
        });
    });

    describe("calculateRebetTotalAmount", () => {
        it("should calculate all amount of bet choices", () => {
            //Act
            const result = processBetQueue.calculateRebetTotalAmount({ player: 100, playerPair: 100 });

            //Assert
            expect(result).toEqual(200);
        });
    });
});
