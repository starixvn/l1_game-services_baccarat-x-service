import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { TableGameData } from "sc-card-game-base";
import RoundQuery from "../../../src/query-apis/round-query";

/** @type {mongoose.Model}*/
const roundsRepository = stubMongoose(mongoose.Model);
/** @type {mongoose.Model}*/
const resultsRepository = stubMongoose(mongoose.Model);

const gameData = new TableGameData();
gameData.shoe = {};

function initRoundQuery() {
    return new RoundQuery(gameData, roundsRepository, resultsRepository);
}

describe("RoundQuery", () => {
    describe("getList", () => {
        it("should return rounds with required data", async () => {
            // arrange
            const round = {
                id: 100,
                settlementResult: {
                    player: true,
                    banker: false,
                    tie: false,
                    playerPair: false,
                    bankerPair: false,
                },
                result: {
                    player: {
                        card1: {
                            rank: 6,
                            suit: 1,
                        },
                        card2: {
                            rank: 0,
                            suit: 1,
                        },
                        card3: null,
                        score: 8,
                    },
                    banker: {
                        card1: {
                            rank: 2,
                            suit: 3,
                        },
                        card2: {
                            rank: 8,
                            suit: 1,
                        },
                        card3: null,
                        score: 2,
                    },
                },
                oddsMultipliers: [
                    {
                        rank: 1,
                        suit: 0,
                        value: 3,
                    },
                    {
                        rank: 5,
                        suit: 2,
                        value: 4,
                    },
                    {
                        rank: 8,
                        suit: 3,
                        value: 3,
                    },
                    {
                        rank: 1,
                        suit: 3,
                        value: 2,
                    },
                    {
                        rank: 7,
                        suit: 0,
                        value: 3,
                    },
                    {
                        rank: 0,
                        suit: 0,
                        value: 3,
                    },
                    {
                        rank: 0,
                        suit: 1,
                        value: 2,
                    },
                ],
                appliedMultipliers: {
                    player: [
                        {
                            rank: 0,
                            suit: 1,
                            value: 2,
                        },
                    ],
                    banker: [],
                },
                time: new Date(),
                exchangeRateId: 4305,
                extraFeeRatio: 0.2,
                usedCardIndexes: [1, 2, 3, 4],
            };

            roundsRepository.find().lean().exec.mockReturnValueOnce([round]);
            const roundQuery = initRoundQuery();
            // act
            const result = await roundQuery.getList(100, {});

            // assert
            expect(result).toEqual([
                {
                    roundId: round.id,
                    result: round.result,
                    settlementResult: round.settlementResult,
                    oddsMultipliers: round.oddsMultipliers,
                    appliedMultipliers: round.appliedMultipliers,
                },
            ]);
        });
    });
});
