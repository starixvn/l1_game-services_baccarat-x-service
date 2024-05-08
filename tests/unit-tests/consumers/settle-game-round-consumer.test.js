import { stub, stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { GameDefinition, Publishers, TableGameData } from "sc-card-game-base";
import { Core } from "sc-game-base";
import MultiplierCardsConsumer from "../../../src/consumers/multiplier-cards-consumer";
import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";
import { getSettlementResult } from "../../../src/helpers/result-helper";

const roundResultPublisher = stub(Publishers.RoundResultPublisher);
const userBetResultPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);
const endGame = jest.fn();
const roundsRepository = stubMongoose(mongoose.Model);
const betsRepository = stubMongoose(mongoose.Model);
const resultsRepository = stubMongoose(mongoose.Model);
const multiplierCardsConsumer = stub(MultiplierCardsConsumer);
const definition = new GameDefinition({}, jest.fn(), jest.fn());
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
};
gameData.gameConfigs = { ...gameConfigs };

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
        gameData.gameConfigs = { ...gameConfigs };
        jest.clearAllMocks();
    });

    describe("generateOddsMultipliers", () => {
        describe("when applyMultiplier is false", () => {
            it("should return undefined", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = false;

                //Assert
                expect(consumer.generateOddsMultipliers()).toBeUndefined();
            });
        });
        describe("when applyMultiplier is true", () => {
            it("should return multipliers", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = true;
                multiplierCardsConsumer.withdrawCards.mockReturnValueOnce([{ value: 1, suit: 0, rank: 10 }]);

                //Act
                const result = consumer.generateOddsMultipliers();

                //Assert
                expect(result).toEqual([{ value: 1, suit: 0, rank: 10 }]);
            });
        });
    });

    describe("settleAppliedMultiplierCards", () => {
        describe("when applyMultiplier is false", () => {
            it("should return undefined", () => {
                //Arrange
                gameData.gameConfigs.applyMultiplier = false;
                //Act
                const result = consumer.settleAppliedMultiplierCards([], {}, {});
                //Assert
                expect(result).toBeUndefined();
            });
        });

        describe("when applyMultiplier is true", () => {
            describe("when player wins", () => {
                it("should return player cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: {
                            card1: {
                                rank: 2,
                                suit: 3,
                            },
                            card2: {
                                rank: 3,
                                suit: 1,
                            },
                        },
                        banker: {
                            card1: {
                                rank: 11,
                                suit: 3,
                            },
                            card2: {
                                rank: 3,
                                suit: 0,
                            },
                            card3: {
                                rank: 8,
                                suit: 1,
                            },
                        },
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
                    expect(result).toEqual([
                        {
                            rank: 2,
                            suit: 3,
                            value: 2,
                        },
                    ]);
                });
            });

            describe("when banker wins", () => {
                it("should return banker cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: {
                            card1: {
                                rank: 0,
                                suit: 0,
                            },
                            card2: {
                                rank: 12,
                                suit: 2,
                            },
                        },
                        banker: {
                            card1: {
                                rank: 7,
                                suit: 2,
                            },
                            card2: {
                                rank: 0,
                                suit: 2,
                            },
                        },
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
                    expect(result).toEqual([
                        {
                            rank: 7,
                            suit: 2,
                            value: 2,
                        },
                    ]);
                });
            });

            describe("when banker and player tie", () => {
                it("should return both player & banker cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: {
                            card1: {
                                rank: 4,
                                suit: 2,
                            },
                            card2: {
                                rank: 11,
                                suit: 3,
                            },
                            card3: {
                                rank: 7,
                                suit: 2,
                            },
                        },
                        banker: {
                            card1: {
                                rank: 8,
                                suit: 2,
                            },
                            card2: {
                                rank: 3,
                                suit: 0,
                            },
                        },
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
                    expect(result).toEqual([
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
                    ]);
                });
            });

            describe("when player has pair ", () => {
                it("should return player cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: {
                            card1: {
                                rank: 5,
                                suit: 2,
                            },
                            card2: {
                                rank: 5,
                                suit: 1,
                            },
                            card3: {
                                rank: 2,
                                suit: 2,
                            },
                        },
                        banker: {
                            card1: {
                                rank: 9,
                                suit: 0,
                            },
                            card2: {
                                rank: 2,
                                suit: 0,
                            },
                            card3: {
                                rank: 4,
                                suit: 0,
                            },
                        },
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
                    ];
                    //Act
                    const result = consumer.settleAppliedMultiplierCards(oddsMultipliers, roundResult, settlementResult);

                    //Assert
                    expect(result).toEqual([
                        {
                            rank: 5,
                            suit: 2,
                            value: 2,
                        },
                    ]);
                });
            });

            describe("when banker has pair ", () => {
                it("should return banker cards exist in oddsMultiplier", () => {
                    //Arrange
                    gameData.gameConfigs.applyMultiplier = true;
                    const roundResult = {
                        player: {
                            card1: {
                                rank: 11,
                                suit: 3,
                            },
                            card2: {
                                rank: 7,
                                suit: 1,
                            },
                        },
                        banker: {
                            card1: {
                                rank: 6,
                                suit: 2,
                            },
                            card2: {
                                rank: 6,
                                suit: 3,
                            },
                        },
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
                    expect(result).toEqual([
                        {
                            rank: 6,
                            suit: 2,
                            value: 2,
                        },
                    ]);
                });
            });
        });
    });

    describe("settleOdds", () => {
        it.each([
            [
                {
                    player: {
                        card1: {
                            rank: 4,
                            suit: 2,
                        },
                        card2: {
                            rank: 11,
                            suit: 3,
                        },
                        card3: {
                            rank: 7,
                            suit: 2,
                        },
                    },
                    banker: {
                        card1: {
                            rank: 8,
                            suit: 2,
                        },
                        card2: {
                            rank: 3,
                            suit: 0,
                        },
                    },
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
                    tie: gameData.gameConfigs.odds.tie * 2 * 5,
                },
            ],
            [
                {
                    player: {
                        card1: {
                            rank: 2,
                            suit: 3,
                        },
                        card2: {
                            rank: 3,
                            suit: 1,
                        },
                    },
                    banker: {
                        card1: {
                            rank: 11,
                            suit: 3,
                        },
                        card2: {
                            rank: 3,
                            suit: 0,
                        },
                        card3: {
                            rank: 8,
                            suit: 1,
                        },
                    },
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
                    player: gameData.gameConfigs.odds.player * 2,
                },
            ],
        ])("should update odds of choices", (result, oddsMultipliers, expectedOdds) => {
            //Act
            const settlementResult = getSettlementResult(result);
            const appliedMultipliers = consumer.settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult);

            const odds = consumer.settleOdds(result, settlementResult, appliedMultipliers);

            //Assert
            expect(odds).toEqual(expectedOdds);
        });
    });
});
