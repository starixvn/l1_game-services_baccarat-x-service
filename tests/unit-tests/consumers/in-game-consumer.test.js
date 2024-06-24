import { Helpers } from "sc-card-game-base";
import { InGameConsumer } from "../../../src/consumers";
import { TableInGameConsumer } from "sc-game-base/src/table/event-consumers";

describe("InGameConsumer", () => {
    const gameManagementApiClientFactory = {
        instance: jest.fn(),
    };
    const getBalance = jest.fn().mockResolvedValueOnce(1000);
    const betPercentage = {
        player: 38,
        banker: 43,
        tie: 19,
    };
    let inGameConsumer;
    let gameData;
    let realPlayer;

    beforeEach(() => {
        gameData = {
            betUserCount: {},
            gameConfigs: {
                oddsMultipliers: {
                    extraFeeRatio: 0.05,
                },
            },
            shoe: {
                cutCardIndex: 10,
                burnedCards: 5,
                cards: [
                    { rank: 1, suit: 1 },
                    { rank: 2, suit: 2 },
                    { rank: 3, suit: 3 },
                ],
                currentIndex: 1,
            },
        };
        inGameConsumer = new InGameConsumer({}, gameData, {}, {}, getBalance, gameManagementApiClientFactory);
        realPlayer = {}; // Mock player object

        jest.spyOn(TableInGameConsumer.prototype, "buildPayload").mockImplementation(async () => ({
            gameConfigs: {},
        }));
        jest.spyOn(Helpers.ResultHelper, "calculateBetUserPercentage").mockReturnValueOnce(betPercentage);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("buildPayload", () => {
        it("should calculate bet percentage correctly", async () => {
            // Arrange
            Helpers.ResultHelper.calculateBetUserPercentage.mockReturnValue(50);

            // Act
            const payload = await inGameConsumer.buildPayload(realPlayer);

            // Assert
            expect(payload.betPercentage).toBe(betPercentage);
        });

        it("should set extraFeeRatio correctly", async () => {
            // Act
            const payload = await inGameConsumer.buildPayload(realPlayer);

            // Assert
            expect(payload.gameConfigs.extraFeeRatio).toBe(0.05);
        });

        it("should delete resultHash from payload", async () => {
            // Act
            const payload = await inGameConsumer.buildPayload(realPlayer);

            // Assert
            expect(payload.resultHash).toBeUndefined();
        });

        describe("when gameData.shoe exists", () => {
            it("should add shoeInfo to the payload", async () => {
                // Act
                const payload = await inGameConsumer.buildPayload(realPlayer);

                // Assert
                expect(payload.shoeInfo).toEqual({
                    cutCardIndex: 10,
                    burnedCards: 5,
                    firstCard: { rank: 1, suit: 1 },
                    currentIndex: 1,
                });
            });
        });

        describe("when gameData.shoe does not exist", () => {
            beforeEach(() => {
                delete inGameConsumer.gameData.shoe;
            });

            it("should not add shoeInfo to the payload", async () => {
                // Act
                const payload = await inGameConsumer.buildPayload(realPlayer);

                // Assert
                expect(payload.shoeInfo).toBeUndefined();
            });
        });
    });
});
