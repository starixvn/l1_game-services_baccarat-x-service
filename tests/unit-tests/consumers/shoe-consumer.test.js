import { ShoeConsumer } from "../../../src/consumers";
import { Helpers } from "sc-card-game-base";
import { getCardFromString } from "../../../src/helpers/card-helper";
import { stubMongoose } from "jest-micro-auto-stub";
import mongoose from "mongoose";

describe("ShoeConsumer", () => {
    let shoeConsumer;
    const mockGameData = {};
    mockResultsRepository = stubMongoose(mongoose.Model);
    mockRoundsRepository = stubMongoose(mongoose.Model);
    mockCutCardPFRepository = stubMongoose(mongoose.Model);

    beforeEach(() => {
        shoeConsumer = new ShoeConsumer(mockGameData, mockResultsRepository, mockRoundsRepository, mockCutCardPFRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getShoeVerification", () => {
        describe("when round and roundResult exist", () => {
            it("should return the correct shoe verification data", async () => {
                // Arrange
                const roundId = 1;
                const mockRound = { id: roundId, usedCardIndexes: [1, 2, 3] };
                const mockRoundResult = {
                    firstRoundId: 1,
                    burnedCards: 3,
                    cutCardIndex: 15,
                    shoe: { encryptedShoe: "encryptedShoe", encryptedShoeHash: "encryptedShoeHash" },
                };
                const mockCutCardPF = { someData: "data" };
                const decryptedShoe = { cards: ["card1", "card2"], rawValue: "rawValue", hashValue: "hashValue" };

                mockRoundsRepository.findOne().lean().exec.mockResolvedValueOnce(mockRound);
                mockResultsRepository.findOne().lean().exec.mockResolvedValueOnce(mockRoundResult);
                mockCutCardPFRepository.findOne().lean().exec.mockResolvedValueOnce(mockCutCardPF);
                shoeConsumer.decryptShoe = jest.fn().mockReturnValue(decryptedShoe);

                // Act
                const result = await shoeConsumer.getShoeVerification(roundId);

                // Assert
                expect(result).toEqual({
                    shoeVerification: {
                        cards: ["card1", "card2"],
                        rawValue: "rawValue",
                        hashValue: "hashValue",
                        usedCardIndexes: [1, 2, 3],
                        burnedCards: 3,
                        cutCardIndex: 15,
                        cutCardPF: mockCutCardPF,
                    },
                });
            });
        });

        describe("when round or roundResult does not exist", () => {
            it("should return an empty shoe verification object", async () => {
                // Arrange
                const roundId = 1;
                mockRoundsRepository.findOne().lean().exec.mockResolvedValueOnce(null);
                mockResultsRepository.findOne().lean().exec.mockResolvedValueOnce(null);

                // Act
                const result = await shoeConsumer.getShoeVerification(roundId);

                // Assert
                expect(result).toEqual({ shoeVerification: {} });
            });
        });
    });

    describe("decryptShoe", () => {
        it("should return decrypted shoe data", () => {
            // Arrange
            const encryptedShoe = "encryptedShoe";
            const encryptedShoeHash = "encryptedShoeHash";
            const decryptedShoe = "2♠3♠";
            const decryptedHash = "hashValue";
            const cards = [
                {
                    rank: 1,
                    suit: 3,
                },
                {
                    rank: 2,
                    suit: 3,
                },
            ];

            jest.spyOn(Helpers.CryptoHelper, "decrypt").mockImplementation((data) => {
                return data === encryptedShoe ? decryptedShoe : decryptedHash;
            });

            // Act
            const result = shoeConsumer.decryptShoe({ encryptedShoe, encryptedShoeHash });

            // Assert
            expect(result).toEqual({
                cards: cards,
                rawValue: decryptedShoe,
                hashValue: decryptedHash,
            });
        });
    });

    describe("generateShoe", () => {
        it("should generate a shoe with given cards from admin and random mode", () => {
            // Arrange
            const cardsFromAdmin = [];
            const randomMode = false;
            const generatedCards = [
                { rank: 1, suit: 2 },
                { rank: 2, suit: 3 },
            ];
            const shoeString = "2♣3♠";
            const rawValue = `${shoeString}_randomString`;
            const hashValue = "hashValue";
            const encryptedShoe = "encryptedShoe";
            const encryptedShoeHash = "encryptedShoeHash";

            jest.spyOn(Helpers.CardChain, "generateCards").mockReturnValue(generatedCards);
            jest.spyOn(Helpers.CardChain, "updateCards").mockReturnValue(generatedCards);
            jest.spyOn(Helpers.CryptoHelper, "randomString").mockReturnValue("randomString");
            jest.spyOn(Helpers.CryptoHelper, "createHashSHA256").mockReturnValue(hashValue);
            jest.spyOn(Helpers.CryptoHelper, "encrypt").mockImplementation((data) => {
                return data === rawValue ? encryptedShoe : encryptedShoeHash;
            });

            // Act
            const result = shoeConsumer.generateShoe(cardsFromAdmin, randomMode);

            // Assert
            expect(result).toEqual({
                cards: generatedCards,
                rawValue,
                hashValue,
                encryptedShoe,
                encryptedShoeHash,
            });
        });
    });
});
