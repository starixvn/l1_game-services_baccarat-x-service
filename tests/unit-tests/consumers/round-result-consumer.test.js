import { RoundResultConsumer } from "../../../src/consumers";

describe("RoundResultConsumer", () => {
    let roundResultConsumer;
    let mockGameData,
        mockDefinition,
        mockRoundResultPublisher,
        mockResultsRepository,
        mockLogService,
        mockCutCardConsumer,
        mockShoeConsumer;

    beforeEach(() => {
        mockGameData = {
            roundId: 1,
            gameConfigs: { randomMode: false },
            settlementResultFromAdmin: {},
            shoe: null,
        };
        mockDefinition = {};
        mockRoundResultPublisher = {
            publishNewShoeHash: jest.fn(),
            publishFinalCutCardIndex: jest.fn(),
        };
        mockResultsRepository = {
            updateOne: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(null) }),
        };
        mockLogService = {};
        mockCutCardConsumer = {
            generateServerCutCardIndex: jest.fn().mockResolvedValue(10),
            calculateCutCardIndex: jest.fn().mockResolvedValue(20),
        };
        mockShoeConsumer = {
            generateShoe: jest.fn().mockReturnValue({
                encryptedShoe: "encryptedShoe",
                encryptedShoeHash: "encryptedShoeHash",
                cards: [{ rank: 2 }],
                rawValue: "rawValue",
                hashValue: "hashValue",
            }),
        };

        roundResultConsumer = new RoundResultConsumer(
            mockGameData,
            mockDefinition,
            mockRoundResultPublisher,
            mockResultsRepository,
            mockLogService,
            mockCutCardConsumer,
            mockShoeConsumer
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateAndPublishHash", () => {
        describe("when the chain is not sufficient", () => {
            it("should set unavailable and publish a new shoe hash", async () => {
                // Arrange
                jest.spyOn(roundResultConsumer, "checkSufficientChain").mockResolvedValue({ isSufficient: false });
                jest.spyOn(roundResultConsumer, "setUnavailable").mockResolvedValue();
                jest.spyOn(roundResultConsumer, "createResultRecord").mockResolvedValue({});

                // Act
                await roundResultConsumer.generateAndPublishHash();

                // Assert
                expect(roundResultConsumer.setUnavailable).toHaveBeenCalled();
            });
        });
    });

    describe("setUnavailable", () => {
        it("should update the results repository", async () => {
            // Arrange & Act
            await roundResultConsumer.setUnavailable();

            // Assert
            expect(mockResultsRepository.updateOne).toHaveBeenCalledWith(
                { isAvailable: true },
                { $set: { isAvailable: false, lastRoundId: mockGameData.roundId - 1 } }
            );
        });
    });

    describe("createResultRecord", () => {
        it("should create a result record in the repository", async () => {
            // Arrange
            jest.spyOn(roundResultConsumer, "getResultFromAdmin").mockReturnValue({});
            jest.spyOn(roundResultConsumer.shoeConsumer, "generateShoe").mockReturnValue({
                encryptedShoe: "encryptedShoe",
                encryptedShoeHash: "encryptedShoeHash",
                cards: [{ rank: 2 }],
                rawValue: "rawValue",
                hashValue: "hashValue",
            });
            jest.spyOn(roundResultConsumer.cutCardConsumer, "generateServerCutCardIndex").mockResolvedValue(10);
            jest.spyOn(roundResultConsumer, "calculateBurnedCards").mockReturnValue(3);

            // Act
            await roundResultConsumer.createResultRecord();

            // Assert
            expect(mockResultsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    isAvailable: true,
                    currentIndex: 3,
                    burnedCards: 3,
                    remainingCards: 0,
                    shoe: {
                        encryptedShoe: "encryptedShoe",
                        encryptedShoeHash: "encryptedShoeHash",
                    },
                    firstRoundId: mockGameData.roundId,
                    cutCardIndex: 10,
                })
            );
        });
    });

    describe("getResultFromAdmin", () => {
        it("should return result from admin", () => {
            // Arrange
            mockGameData.settlementResultFromAdmin = { result: { luckyCards: [1, 2, 3] } };

            // Act
            const result = roundResultConsumer.getResultFromAdmin();

            // Assert
            expect(result).toEqual(expect.objectContaining({ luckyCardsFromAdmin: [1, 2, 3] }));
        });
    });

    describe("calculateBurnedCards", () => {
        it("should calculate burned cards based on the first card rank", () => {
            // Arrange
            const cards = [{ rank: 2 }];

            // Act
            const burnedCards = roundResultConsumer.calculateBurnedCards(cards);

            // Assert
            expect(burnedCards).toBe(4);
        });
    });

    describe("checkSufficientChain", () => {
        describe("when hasResultFromAdmin true", () => {
            it("should return isSufficient false", async () => {
                // Arrange
                roundResultConsumer.hasResultFromAdmin = jest.fn(() => true);

                // Assert
                const result = await roundResultConsumer.checkSufficientChain();

                // Assert
                expect(result.isSufficient).toBe(false);
            });
        });

        describe("when shoe not found", () => {
            it("should return isSufficient false", async () => {
                // Arrange
                roundResultConsumer.hasResultFromAdmin = jest.fn(() => false);

                // Assert
                const result = await roundResultConsumer.checkSufficientChain();

                // Assert
                expect(result.isSufficient).toBe(false);
            });
        });

        describe("when current index not reach cut card", () => {
            it("should return isSufficient true ", async () => {
                // Arrange
                mockGameData.shoe = { currentIndex: 315, cutCardIndex: 320 };
                jest.spyOn(roundResultConsumer, "hasResultFromAdmin").mockReturnValue(false);
                jest.spyOn(roundResultConsumer, "lessThanCutCard").mockReturnValue(true);

                // Act
                const result = await roundResultConsumer.checkSufficientChain();

                // Assert
                expect(result.isSufficient).toBe(true);
            });
        });

        describe("when current index reach cut card", () => {
            beforeEach(() => {
                jest.spyOn(roundResultConsumer, "hasResultFromAdmin").mockReturnValueOnce(false);
                jest.spyOn(roundResultConsumer, "lessThanCutCard").mockReturnValueOnce(false);
            });

            describe("when must deal cards for remaining cards in round", () => {
                //remaining in range [1,2]
                it("should return isSufficient true ", async () => {
                    // Arrange
                    mockGameData.shoe = { currentIndex: 320, cutCardIndex: 320, remainingCards: 2 };
                    jest.spyOn(roundResultConsumer, "mustDealCards").mockReturnValueOnce(true);

                    // Act
                    const result = await roundResultConsumer.checkSufficientChain();

                    // Assert
                    expect(result.isSufficient).toBe(true);
                });
            });

            describe("when dont need deal cards for remaining cards in round", () => {
                //remaining in range [1,2]
                it("should return isSufficient false ", async () => {
                    // Arrange
                    mockGameData.shoe = { currentIndex: 320, cutCardIndex: 320, remainingCards: 0 };
                    jest.spyOn(roundResultConsumer, "mustDealCards").mockReturnValueOnce(false);

                    // Act
                    const result = await roundResultConsumer.checkSufficientChain();

                    // Assert
                    expect(result.isSufficient).toBe(false);
                });
            });
        });
    });

    describe("lessThanCutCard", () => {
        describe("when current index not reach cut card", () => {
            it("should return true ", () => {
                // Arrange
                const shoe = { currentIndex: 315, cutCardIndex: 320 };

                // Act
                const result = roundResultConsumer.lessThanCutCard(shoe);

                // Assert
                expect(result).toBe(true);
            });
        });

        describe("when current index reach cut card", () => {
            it("should return false", () => {
                // Arrange
                const shoe = { currentIndex: 321, cutCardIndex: 320 };

                // Act
                const result = roundResultConsumer.lessThanCutCard(shoe);

                // Assert
                expect(result).toBe(false);
            });
        });
    });

    describe("mustDealCards", () => {
        describe("when current index equal cut card", () => {
            describe("when has remaining cards in round", () => {
                //remaining in range [1,2]
                it("should return true", () => {
                    // Arrange
                    const shoe = { currentIndex: 320, cutCardIndex: 320, remainingCards: 2 };

                    // Act
                    const result = roundResultConsumer.mustDealCards(shoe);

                    // Assert
                    expect(result).toBe(true);
                });
            });

            describe("when no remaining cards in round", () => {
                //remaining in range [1,2]
                it("should return false ", () => {
                    // Arrange
                    const shoe = { currentIndex: 320, cutCardIndex: 320, remainingCards: 0 };

                    // Act
                    const result = roundResultConsumer.mustDealCards(shoe);

                    // Assert
                    expect(result).toBe(false);
                });
            });
        });

        describe("when current index not equal cut card", () => {
            it("should return false ", () => {
                // Arrange
                const shoe = { currentIndex: 321, cutCardIndex: 320, remainingCards: 0 };

                // Act
                const result = roundResultConsumer.mustDealCards(shoe);

                // Assert
                expect(result).toBe(false);
            });
        });
    });

    describe("updateAndPublishFinalCutCardIndex", () => {
        it("should publish final cut card index when presetCutCardIndex is false", async () => {
            // Arrange
            mockGameData.shoe = { presetCutCardIndex: false };
            jest.spyOn(roundResultConsumer.cutCardConsumer, "calculateCutCardIndex").mockResolvedValue(20);

            // Act
            await roundResultConsumer.updateAndPublishFinalCutCardIndex();

            // Assert
            expect(mockResultsRepository.updateOne).toHaveBeenCalledWith(
                { firstRoundId: mockGameData.roundId, isAvailable: true },
                { $set: { cutCardIndex: 20 } }
            );
            expect(mockRoundResultPublisher.publishFinalCutCardIndex).toHaveBeenCalled();
        });
    });
});
