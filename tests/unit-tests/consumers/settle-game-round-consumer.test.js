import { stub, stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { GameDefinition, Publishers, TableGameData } from "sc-card-game-base";
import { Core } from "sc-game-base";
import { MultiplierCardsConsumer } from "../../../src/consumers";
import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";
import gameSettings from "../../../src/game-settings";
import BaccaratPlayer from "../../../src/helpers/baccarat-player";
import { getSettlementResult } from "../../../src/helpers/result-helper";

const roundResultPublisher = stub(Publishers.RoundResultPublisher);
const userBetResultPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);
const endGame = jest.fn();
const roundsRepository = stubMongoose(mongoose.Model);
const betsRepository = stubMongoose(mongoose.Model);
const resultsRepository = stubMongoose(mongoose.Model);
const multiplierCardsConsumer = stub(MultiplierCardsConsumer);

const generateResult = jest.fn();
const definition = new GameDefinition(gameSettings[0], generateResult, getSettlementResult);
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
};
gameData.gameConfigs = { ...gameConfigs };

const gameManagementApiClientFactory = {
    instance: jest.fn(),
};

class TestBaccaratPlayer extends BaccaratPlayer {
    constructor(card1, card2, card3) {
        super();

        this.card1 = card1;
        this.card2 = card2;
        this.card3 = card3;
        this.updateScore();
    }
}

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
        gameData.gameConfigs = { ...gameConfigs };
        jest.clearAllMocks();
    });

    describe("settleAppliedMultiplierCards", () => {
        describe("when applyMultiplier is true", () => {
            describe("when player wins", () => {
                it("should return player cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: new TestBaccaratPlayer(
                            {
                                rank: 2,
                                suit: 3,
                            },
                            {
                                rank: 3,
                                suit: 1,
                            }
                        ),
                        banker: new TestBaccaratPlayer(
                            {
                                rank: 11,
                                suit: 3,
                            },
                            {
                                rank: 3,
                                suit: 0,
                            },
                            {
                                rank: 8,
                                suit: 1,
                            }
                        ),
                    };

                    const settlementResult = {
                        player: true,
                        banker: false,
                        tie: false,
                        playerPair: false,
                        bankerPair: false,
                    };

                    const oddsMultipliers = [
                        {
                            rank: 2,
                            suit: 3,
                            value: 2,
                        },
                        {
                            rank: 5,
                            suit: 1,
                            value: 4,
                        },
                        {
                            rank: 11,
                            suit: 3,
                            value: 4,
                        },
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual({
                        player: [
                            {
                                rank: 2,
                                suit: 3,
                                value: 2,
                            },
                        ],
                        banker: [],
                    });
                });
            });

            describe("when banker wins", () => {
                it("should return banker cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: new TestBaccaratPlayer(
                            {
                                rank: 0,
                                suit: 0,
                            },
                            {
                                rank: 12,
                                suit: 2,
                            }
                        ),
                        banker: new TestBaccaratPlayer(
                            {
                                rank: 7,
                                suit: 2,
                            },
                            {
                                rank: 0,
                                suit: 2,
                            }
                        ),
                    };

                    const settlementResult = {
                        player: false,
                        banker: true,
                        tie: false,
                        playerPair: false,
                        bankerPair: false,
                    };

                    const oddsMultipliers = [
                        {
                            rank: 7,
                            suit: 2,
                            value: 2,
                        },
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual({
                        banker: [
                            {
                                rank: 7,
                                suit: 2,
                                value: 2,
                            },
                        ],
                        player: [],
                    });
                });
            });

            describe("when banker and player tie", () => {
                it("should return both player & banker cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: new TestBaccaratPlayer(
                            {
                                rank: 4,
                                suit: 2,
                            },
                            {
                                rank: 11,
                                suit: 3,
                            },
                            {
                                rank: 7,
                                suit: 2,
                            }
                        ),
                        banker: new TestBaccaratPlayer(
                            {
                                rank: 8,
                                suit: 2,
                            },
                            {
                                rank: 3,
                                suit: 0,
                            }
                        ),
                    };

                    const settlementResult = {
                        player: false,
                        banker: false,
                        tie: true,
                        playerPair: false,
                        bankerPair: false,
                    };

                    const oddsMultipliers = [
                        {
                            rank: 11,
                            suit: 3,
                            value: 2,
                        },
                        {
                            rank: 8,
                            suit: 2,
                            value: 5,
                        },
                        {
                            rank: 1,
                            suit: 2,
                            value: 3,
                        },
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual({
                        banker: [
                            {
                                rank: 8,
                                suit: 2,
                                value: 5,
                            },
                        ],
                        player: [
                            {
                                rank: 11,
                                suit: 3,
                                value: 2,
                            },
                        ],
                    });
                });
            });

            describe("when player has pair ", () => {
                it("should return player cards exist in oddsMultiplier exluding 3rd card", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: new TestBaccaratPlayer(
                            {
                                rank: 5,
                                suit: 2,
                            },
                            {
                                rank: 5,
                                suit: 1,
                            },
                            {
                                rank: 2,
                                suit: 2,
                            }
                        ),
                        banker: new TestBaccaratPlayer(
                            {
                                rank: 9,
                                suit: 0,
                            },
                            {
                                rank: 2,
                                suit: 0,
                            },
                            {
                                rank: 4,
                                suit: 0,
                            }
                        ),
                    };

                    const settlementResult = {
                        player: false,
                        banker: true,
                        tie: false,
                        playerPair: true,
                        bankerPair: false,
                    };

                    const oddsMultipliers = [
                        {
                            rank: 5,
                            suit: 2,
                            value: 2,
                        },
                        {
                            rank: 8,
                            suit: 2,
                            value: 5,
                        },
                        {
                            rank: 1,
                            suit: 2,
                            value: 3,
                        },
                        {
                            rank: 2,
                            suit: 2,
                            value: 2,
                        },
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual({
                        player: [
                            {
                                rank: 5,
                                suit: 2,
                                value: 2,
                            },
                        ],
                        banker: [],
                    });
                });
            });

            describe("when banker has pair ", () => {
                it("should return banker cards exist in oddsMultiplier excluding 3rd card", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: new TestBaccaratPlayer(
                            {
                                rank: 11,
                                suit: 3,
                            },
                            {
                                rank: 7,
                                suit: 1,
                            }
                        ),
                        banker: new TestBaccaratPlayer(
                            {
                                rank: 6,
                                suit: 2,
                            },
                            {
                                rank: 6,
                                suit: 3,
                            },
                            {
                                rank: 1,
                                suit: 2,
                            }
                        ),
                    };

                    const settlementResult = {
                        player: true,
                        banker: false,
                        tie: false,
                        playerPair: true,
                        bankerPair: true,
                    };

                    const oddsMultipliers = [
                        {
                            rank: 6,
                            suit: 2,
                            value: 2,
                        },
                        {
                            rank: 8,
                            suit: 2,
                            value: 5,
                        },
                        {
                            rank: 1,
                            suit: 2,
                            value: 3,
                        },
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual({
                        player: [],
                        banker: [
                            {
                                rank: 6,
                                suit: 2,
                                value: 2,
                            },
                        ],
                    });
                });
            });
        });
    });

    describe("settleOdds", () => {
        it.each([
            [
                {
                    player: new TestBaccaratPlayer(
                        {
                            rank: 4,
                            suit: 2,
                        },
                        {
                            rank: 11,
                            suit: 3,
                        },
                        {
                            rank: 7,
                            suit: 2,
                        }
                    ),
                    banker: new TestBaccaratPlayer(
                        {
                            rank: 8,
                            suit: 2,
                        },
                        {
                            rank: 3,
                            suit: 0,
                        }
                    ),
                },
                [
                    {
                        rank: 11,
                        suit: 3,
                        value: 2,
                    },
                    {
                        rank: 8,
                        suit: 2,
                        value: 5,
                    },
                ],
                {
                    ...gameData.gameConfigs.odds,
                    tie: (gameData.gameConfigs.odds.tie - 1) * 2 * 5 + 1,
                },
            ],
            [
                {
                    player: new TestBaccaratPlayer(
                        {
                            rank: 2,
                            suit: 3,
                        },
                        {
                            rank: 3,
                            suit: 1,
                        }
                    ),
                    banker: new TestBaccaratPlayer(
                        {
                            rank: 11,
                            suit: 3,
                        },
                        {
                            rank: 3,
                            suit: 0,
                        },
                        {
                            rank: 8,
                            suit: 1,
                        }
                    ),
                },
                [
                    {
                        rank: 2,
                        suit: 3,
                        value: 2,
                    },
                    {
                        rank: 5,
                        suit: 1,
                        value: 4,
                    },
                    {
                        rank: 11,
                        suit: 3,
                        value: 4,
                    },
                ],
                {
                    ...gameData.gameConfigs.odds,
                    player: (gameData.gameConfigs.odds.player - 1) * 2 + 1,
                },
            ],
            [
                {
                    player: new TestBaccaratPlayer(
                        {
                            rank: 6,
                            suit: 0,
                        },
                        {
                            rank: 12,
                            suit: 0,
                        }
                    ),
                    banker: new TestBaccaratPlayer(
                        {
                            rank: 10,
                            suit: 0,
                        },
                        {
                            rank: 10,
                            suit: 0,
                        },
                        {
                            rank: 12,
                            suit: 3,
                        }
                    ),
                },
                [
                    {
                        rank: 8,
                        suit: 2,
                        value: 2,
                    },
                    {
                        rank: 12,
                        suit: 3,
                        value: 3,
                    },
                    {
                        rank: 4,
                        suit: 2,
                        value: 2,
                    },
                    {
                        rank: 6,
                        suit: 1,
                        value: 2,
                    },
                    {
                        rank: 11,
                        suit: 2,
                        value: 2,
                    },
                    {
                        rank: 3,
                        suit: 1,
                        value: 2,
                    },
                    {
                        rank: 4,
                        suit: 1,
                        value: 3,
                    },
                ],
                {
                    ...gameData.gameConfigs.odds,
                },
            ],
            [
                {
                    player: new TestBaccaratPlayer(
                        {
                            rank: 1,
                            suit: 1,
                        },
                        {
                            rank: 1,
                            suit: 1,
                        },
                        {
                            rank: 4,
                            suit: 2,
                        }
                    ),
                    banker: new TestBaccaratPlayer(
                        {
                            rank: 1,
                            suit: 3,
                        },
                        {
                            rank: 1,
                            suit: 0,
                        },
                        {
                            rank: 2,
                            suit: 2,
                        }
                    ),
                },
                [
                    {
                        rank: 1,
                        suit: 1,
                        value: 2,
                    },
                    {
                        rank: 1,
                        suit: 0,
                        value: 3,
                    },
                    {
                        rank: 9,
                        suit: 4,
                        value: 4,
                    },
                    {
                        rank: 4,
                        suit: 2,
                        value: 3,
                    },
                ],
                {
                    ...gameData.gameConfigs.odds,
                    player: 2 * 2 * 3 * (gameData.gameConfigs.odds.player - 1) + 1,
                    playerPair: 2 * 2 * (gameData.gameConfigs.odds.playerPair - 1) + 1,
                    bankerPair: 3 * (gameData.gameConfigs.odds.bankerPair - 1) + 1,
                },
            ],
        ])("should update odds of choices with multipliers", (result, oddsMultipliers, expectedOdds) => {
            //Arrange
            result.player.updateScore();
            result.banker.updateScore();
            const settlementResult = getSettlementResult(result);
            const appliedMultipliers = consumer.settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult);
            const appliedCardsPerChoice = consumer.settleAppliedCardsPerChoice(result, appliedMultipliers);

            //Act
            const odds = consumer.settleOdds(settlementResult, appliedCardsPerChoice);

            //Assert
            expect(odds).toEqual(expectedOdds);
        });
    });

    describe("calculateBetResult", () => {
        //Arrange
        const settlementResult = {
            player: true,
            banker: false,
            tie: false,
            playerPair: false,
            bankerPair: false,
        };

        const bet = {
            name: "player1",
            player: 2,
            banker: 0,
            tie: 0,
            playerPair: 2,
            bankerPair: 0,
            fee: 0.8,
            totalAmount: 4.8,
            maxWin: 4000000,
        };

        const appliedCardsPerChoice = {
            player: [{ suit: 1, rank: 1, value: 2 }],
        };

        gameData.ingame[bet.name] = {
            currencyGroupId: "111",
            maxBet: 2000,
        };

        it("should calculate betResult.totalAmount", () => {
            //Act
            const betResult = consumer.calculateBetResult(settlementResult, bet, gameConfigs.odds, appliedCardsPerChoice);

            //Assert
            expect(betResult.totalBetAmount).toEqual(bet.totalAmount);
        });

        it("should calculate betResult.multipliers", () => {
            //Act
            const betResult = consumer.calculateBetResult(settlementResult, bet, gameConfigs.odds, appliedCardsPerChoice);

            //Assert
            expect(betResult.multipliers).toEqual({ player: [2] });
        });

        it("should calculate betResult.totalWin", () => {
            //Act
            const betResult = consumer.calculateBetResult(settlementResult, bet, gameConfigs.odds, appliedCardsPerChoice);

            //Assert
            expect(betResult.totalWin).toEqual(bet.player * gameConfigs.odds.player);
        });

        it("should refund player/bank bet amount when result is tie", () => {
            //Act
            const betResult = consumer.calculateBetResult(
                {
                    player: false,
                    banker: false,
                    tie: true,
                    playerPair: false,
                    bankerPair: false,
                },
                bet,
                gameConfigs.odds,
                appliedCardsPerChoice
            );

            //Assert
            expect(betResult.totalWin).toEqual(bet.player);
        });

        afterAll(() => {
            gameData.ingame = {};
        });
    });

    describe("generateResult", () => {
        it("should return result", async () => {
            gameData.shoe = {
                currentIndex: 0,
            };
            generateResult.mockReturnValueOnce({
                result: {
                    player: {
                        card1: {
                            rank: 10,
                            suit: 1,
                        },
                        card2: {
                            rank: 8,
                            suit: 0,
                        },
                        card3: null,
                        score: 9,
                    },
                    banker: {
                        card1: {
                            rank: 12,
                            suit: 3,
                        },
                        card2: {
                            rank: 8,
                            suit: 3,
                        },
                        card3: null,
                        score: 9,
                    },
                },
                usedCardsCount: 4,
            });

            const { result, usedCardIndexes } = await consumer.generateResult();

            expect(usedCardIndexes).toEqual([0, 1, 2, 3]);
            expect(result).toEqual({
                player: {
                    card1: {
                        rank: 10,
                        suit: 1,
                    },
                    card2: {
                        rank: 8,
                        suit: 0,
                    },
                    card3: null,
                    score: 9,
                },
                banker: {
                    card1: {
                        rank: 12,
                        suit: 3,
                    },
                    card2: {
                        rank: 8,
                        suit: 3,
                    },
                    card3: null,
                    score: 9,
                },
            });
        });

        it("should update gameData.shoe.currentIndex", async () => {
            gameData.shoe = {
                currentIndex: 0,
            };
            generateResult.mockReturnValueOnce({
                result: {
                    player: {
                        card1: {
                            rank: 10,
                            suit: 1,
                        },
                        card2: {
                            rank: 8,
                            suit: 0,
                        },
                        card3: null,
                        score: 9,
                    },
                    banker: {
                        card1: {
                            rank: 12,
                            suit: 3,
                        },
                        card2: {
                            rank: 8,
                            suit: 3,
                        },
                        card3: null,
                        score: 9,
                    },
                },
                usedCardsCount: 4,
            });

            await consumer.generateResult();
            expect(gameData.shoe.currentIndex).toEqual(4);
        });
    });

    describe("settleRound", () => {
        const resultGenerated = {
            result: {
                player: new TestBaccaratPlayer(
                    {
                        rank: 10,
                        suit: 1,
                    },
                    {
                        rank: 8,
                        suit: 0,
                    },
                    null
                ),
                banker: new TestBaccaratPlayer(
                    {
                        rank: 12,
                        suit: 3,
                    },
                    {
                        rank: 8,
                        suit: 3,
                    },
                    null
                ),
            },
            usedCardIndexes: 4,
        };
        afterEach(() => {
            gameData.oddsMultipliers = null;
        });
        it("should calculate odds with multiplier cards", async () => {
            //Arrange
            gameData.oddsMultipliers = [{ rank: 10, suit: 1, value: 4 }];
            roundsRepository.create.mockResolvedValueOnce({ id: 1, time: new Date() });
            const spy = jest.spyOn(consumer, "settleOdds");

            //Act
            await consumer.settleRound(resultGenerated);

            //Assert
            expect(spy).toHaveBeenCalled();
        });
    });
});
