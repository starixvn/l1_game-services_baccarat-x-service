import RoundResultPublisher from "../../../src/publishers/round-result-publisher";
import BaseEventPublisher from "sc-game-base/src/core/event-publishers/base-event-publisher";

jest.mock("sc-game-base", () => ({
    Core: {
        BaseEventPublishers: {
            BaseEventPublisher: class {
                publishToAllUsers = jest.fn();
                publishToAllAdmins = jest.fn();
            },
        },
    },
}));

describe("RoundResultPublisher", () => {
    let roundResultPublisher, gameData;
    const logService = {
        logCritical: jest.fn(),
    };

    beforeEach(() => {
        gameData = {
            shoe: {
                hashValue: "hash123",
                cutCardIndex: 5,
                burnedCards: ["card1", "card2"],
                cards: ["card3", "card4", "card5"],
            },
        };

        roundResultPublisher = new RoundResultPublisher();
        roundResultPublisher.gameData = gameData;
        roundResultPublisher.logService = logService;

        jest.spyOn(BaseEventPublisher.prototype, "publishToAllAdmins").mockImplementation(() => {});
        jest.spyOn(BaseEventPublisher.prototype, "publishToAllUsers").mockImplementation(() => {});
    });

    describe("publishRoundResult", () => {
        // Arrange
        const roundResult = { some: "result" };
        const payload = { finish: roundResult };

        it("should publish round result to all users", () => {
            // Act
            roundResultPublisher.publishRoundResult(roundResult);
            // Assert
            expect(roundResultPublisher.publishToAllUsers).toHaveBeenCalledWith(payload);
        });

        it("should publish round result to all admins", () => {
            // Act
            roundResultPublisher.publishRoundResult(roundResult);
            // Assert
            expect(roundResultPublisher.publishToAllAdmins).toHaveBeenCalledWith(payload);
        });
    });

    describe("publishNewShoeHash", () => {
        describe("when shoe exists", () => {
            // Arrange
            const payload = { newShoeHash: "hash123" };

            it("should publish new shoe hash to all users", () => {
                // Act
                roundResultPublisher.publishNewShoeHash();
                // Assert
                expect(roundResultPublisher.publishToAllUsers).toHaveBeenCalledWith(payload);
            });

            it("should publish new shoe hash to all admins", () => {
                // Act
                roundResultPublisher.publishNewShoeHash();
                // Assert
                expect(roundResultPublisher.publishToAllAdmins).toHaveBeenCalledWith(payload);
            });
        });

        describe("when shoe does not exist", () => {
            // Arrange
            beforeEach(() => {
                roundResultPublisher.gameData.shoe = null;
            });

            it("should not publish new shoe hash to all users", () => {
                // Act
                roundResultPublisher.publishNewShoeHash();
                // Assert
                expect(roundResultPublisher.publishToAllUsers).not.toHaveBeenCalled();
            });

            it("should not publish new shoe hash to all admins", () => {
                // Act
                roundResultPublisher.publishNewShoeHash();
                // Assert
                expect(roundResultPublisher.publishToAllAdmins).not.toHaveBeenCalled();
            });

            it("should log critical", () => {
                // Act
                roundResultPublisher.publishNewShoeHash();
                // Assert
                expect(logService.logCritical).toHaveBeenCalledWith("Shoe is NOT empty or undefined");
            });
        });
    });

    describe("publishFinalCutCardIndex", () => {
        describe("when shoe exists", () => {
            // Arrange
            const payload = {
                shoeInfo: {
                    cutCardIndex: 5,
                    burnedCards: ["card1", "card2"],
                    firstCard: "card3",
                    new: true,
                },
            };

            it("should publish final cut card index to all users", () => {
                // Act
                roundResultPublisher.publishFinalCutCardIndex();
                // Assert
                expect(roundResultPublisher.publishToAllUsers).toHaveBeenCalledWith(payload);
            });

            it("should publish final cut card index to all admins", () => {
                // Act
                roundResultPublisher.publishFinalCutCardIndex();
                // Assert
                expect(roundResultPublisher.publishToAllAdmins).toHaveBeenCalledWith(payload);
            });
        });
    });

    describe("publishWinners", () => {
        describe("when publishing winners", () => {
            // Arrange
            const roundId = 1;
            const winningPlayers = ["player1", "player2"];
            const payload = {
                roundId,
                winningPlayers,
            };

            it("should publish winners to all users", () => {
                // Act
                roundResultPublisher.publishWinners(roundId, winningPlayers);
                // Assert
                expect(roundResultPublisher.publishToAllUsers).toHaveBeenCalledWith({
                    winners: payload,
                });
            });
        });
    });

    describe("publishMultiplierCards", () => {
        describe("when publishing multiplier cards", () => {
            // Arrange
            const multiplierCards = ["card1", "card2"];

            it("should publish multiplier cards to all users", () => {
                // Act
                roundResultPublisher.publishMultiplierCards(multiplierCards);
                // Assert
                expect(roundResultPublisher.publishToAllUsers).toHaveBeenCalledWith({ multiplierCards });
            });
        });
    });
});
