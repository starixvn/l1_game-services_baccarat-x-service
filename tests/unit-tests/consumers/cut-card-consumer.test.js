import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import CutCardConsumer from "../../../src/consumers/cut-card-consumer";

describe("cutCardConsumer", () => {
    let consumer;
    const roundId = 124,
        gameData = { remainingTime: 50, roundId },
        definition = {
            minCutCardIndex: 10,
            maxCutCardIndex: 50,
            durations: {
                wholeRound: 48,
                placingBets: 30,
                lockingBet: 3,
                dealCards: 5,
                changingDeck: 20,
                cutCard: 3,
                generatingShoe: 55,
                generatingCutCardIndex: 45,
            },
        },
        publisher = {
            publishToUser: jest.fn(),
        },
        logService = {
            logError: jest.fn(),
        },
        cutCardPFRepository = stubMongoose(mongoose.Model),
        player = {
            UID: "UID",
            profile: {
                name: "rate",
            },
        },
        payload = { cutCardIndex: 123 };

    beforeEach(() => {
        consumer = new CutCardConsumer(gameData, definition, publisher, cutCardPFRepository, logService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("consume", () => {
        beforeEach(() => {
            consumer.validatePlayerCutCard = jest.fn();
            consumer.insertPlayerCutCard = jest.fn();
        });

        it("should call validatePlayerCutCard", async () => {
            // Act
            await consumer.consume(player, payload);

            // Assert
            expect(consumer.validatePlayerCutCard).toHaveBeenCalledWith(payload, player.profile.name);
        });

        describe("when payload is valid", () => {
            beforeEach(() => {
                consumer.validatePlayerCutCard.mockReturnValueOnce(true);
            });

            it("should call insertPlayerCutCard", async () => {
                // Act
                await consumer.consume(player, payload);

                // Assert
                expect(consumer.insertPlayerCutCard).toHaveBeenCalledWith(player.profile.name, payload.cutCardIndex);
            });

            it("should publishToUser cut card successfully", async () => {
                // Act
                await consumer.consume(player, payload);

                // Assert
                expect(publisher.publishToUser).toHaveBeenCalledWith(player.UID, {
                    cutCard: { successful: true, cutCardIndex: payload.cutCardIndex },
                });
            });
        });

        describe("when payload is invalid", () => {
            beforeEach(() => {
                consumer.validatePlayerCutCard.mockReturnValueOnce(false);
            });

            it("should publish failed", async () => {
                // Act
                await consumer.consume(player, payload);

                // Assert
                expect(publisher.publishToUser).toHaveBeenCalledWith(player.UID, { cutCard: { successful: false } });
            });
        });
    });

    describe("validatePlayerCutCard", () => {
        describe("when exist cut card info", () => {
            it("should return false", async () => {
                // Arrange
                const playerName = "Mike";
                cutCardPFRepository.exist = jest.fn().mockResolvedValueOnce({ name: playerName });

                // Act
                const result = await consumer.validatePlayerCutCard({}, playerName);

                // Assert
                expect(result).toBeFalsy();
            });
        });

        describe("when remaining time is sufficient", () => {
            describe("when cut card index is within the valid range", () => {
                it("should return true", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 25 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(true);
                });
            });

            describe("when cut card index is less than minCutCardIndex", () => {
                it("should return false", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 5 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(false);
                });
            });

            describe("when cut card index is greater than maxCutCardIndex", () => {
                it("should return false", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 55 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(false);
                });
            });

            describe("when cut card index is exactly minCutCardIndex", () => {
                it("should return true", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 10 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(true);
                });
            });

            describe("when cut card index is exactly maxCutCardIndex", () => {
                it("should return true", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 50 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(true);
                });
            });
        });

        describe("when remaining time is not sufficient", () => {
            beforeEach(() => {
                consumer.gameData.remainingTime = 100;
            });

            describe("when cut card index is within the valid range", () => {
                it("should return false", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 25 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(false);
                });
            });
        });

        describe("when remaining time is exactly the threshold", () => {
            beforeEach(() => {
                consumer.gameData.remainingTime = 45; // wholeRound + cutCard
            });

            describe("when cut card index is within the valid range", () => {
                it("should return false", async () => {
                    // Arrange
                    const cutCard = { cutCardIndex: 25 };

                    // Act
                    const result = await consumer.validatePlayerCutCard(cutCard);

                    // Assert
                    expect(result).toBe(false);
                });
            });
        });
    });

    describe("insertPlayerCutCard", () => {
        it("should call cutCardRepository.updateOne", async () => {
            // Arrange
            const mockDate = new Date();

            jest.spyOn(global, "Date").mockReturnValueOnce(mockDate);

            // Act
            await consumer.insertPlayerCutCard(player.profile.name, payload.cutCardIndex);

            // Assert
            expect(cutCardPFRepository.updateOne).toHaveBeenCalledWith(
                { roundId },
                { $addToSet: { playerCutCards: { name: player.profile.name, clientSeed: payload.cutCardIndex, time: mockDate } } }
            );
        });
    });

    describe("generateServerCutCardIndex", () => {
        const serverCutCardIndex = 124;
        const { roundId } = gameData;

        beforeEach(() => {
            consumer.chance.integer = jest.fn().mockReturnValueOnce(serverCutCardIndex);
        });

        it("should call cutCardPFRepository.create", async () => {
            // Arrange
            const mockDate = new Date();
            jest.spyOn(global, "Date").mockReturnValueOnce(mockDate);

            // Act
            await consumer.generateServerCutCardIndex();

            // Assert
            expect(cutCardPFRepository.create).toHaveBeenCalledWith({ roundId, serverCutCardIndex, time: mockDate, playerCutCards: [] });
        });

        it("should return serverCutCardIndex", async () => {
            // Act
            const actualResult = await consumer.generateServerCutCardIndex();

            // Assert
            expect(actualResult).toBe(serverCutCardIndex);
        });
    });

    describe("calculateCutCardIndex", () => {
        it("should return cutCardIndex", async () => {
            // Arrange
            const serverCutCardIndex = 145;
            const playerCutCards = [{ clientSeed: 156 }, { clientSeed: 136 }];
            const expectResult = Math.floor((serverCutCardIndex + playerCutCards[0].clientSeed + playerCutCards[1].clientSeed) / 3);
            cutCardPFRepository.findOne().lean().exec.mockResolvedValueOnce({ serverCutCardIndex, playerCutCards });

            // Act
            const actualResult = await consumer.calculateCutCardIndex();

            // Assert
            expect(actualResult).toBe(expectResult);
        });
    });
});
