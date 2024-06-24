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
        it("should return true when there is sufficient chain", async () => {
            // Arrange
            jest.spyOn(roundResultConsumer.resultsRepository, "findOne").mockReturnValue({
                lean: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue({ currentIndex: 315, cutCardIndex: 320 }),
            });
            jest.spyOn(roundResultConsumer, "hasResultFromAdmin").mockReturnValue(false);

            // Act
            const result = await roundResultConsumer.checkSufficientChain();

            // Assert
            expect(result.isSufficient).toBe(true);
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
