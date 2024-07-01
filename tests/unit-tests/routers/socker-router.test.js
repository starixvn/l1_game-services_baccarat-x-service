import { MultipleGamesSocketRouter } from "sc-multiple-games-base";
import { SocketRouter } from "../../../src/routers";

const socketClient = {
    on: jest.fn(),
    emit: jest.fn(),
    id: "socket1",
};
const logService = {
    logError: jest.fn(),
};
const gameData = {
    realPlayers: {
        socket1: { id: "player1" },
    },
};
const cutCardConsumer = {
    consume: jest.fn(),
};
const shoeConsumer = {
    getShoeVerification: jest.fn(),
};

describe("SocketRouter", () => {
    const dependencies = {
        definition: { name: "testGame" },
        gameData,
        userSignInConsumer: jest.fn(),
        inGameConsumer: jest.fn(),
        placeBetConsumer: jest.fn(),
        userDisconnectConsumer: jest.fn(),
        userSignInPublisher: jest.fn(),
        historyQuery: jest.fn(),
        logService,
        playGamePermissionValidator: jest.fn(),
        allGamesHistoryQuery: jest.fn(),
        cutCardConsumer,
        shoeConsumer,
        roundQuery: jest.fn(),
        gameResultServiceConsumer: jest.fn(),
    };
    let socketRouter;

    beforeEach(() => {
        socketRouter = new SocketRouter({ ...dependencies });
        socketRouter.socketClient = socketClient;

        jest.spyOn(MultipleGamesSocketRouter.prototype, "init").mockImplementation(() => {});
    });

    describe("init", () => {
        it("should initialize socketClient with event cutCard", () => {
            // Act
            socketRouter.init(socketClient);

            // Assert
            expect(socketClient.on).toHaveBeenCalledWith("cutCard", expect.any(Function));
        });

        it("should initialize socketClient with event shoeVerification", () => {
            // Act
            socketRouter.init(socketClient);

            // Assert
            expect(socketClient.on).toHaveBeenCalledWith("shoeVerification", expect.any(Function));
        });
    });

    describe("handleCutCard", () => {
        describe("when verify fails", () => {
            it("should not consume cut card", () => {
                // Arrange
                const payload = { card: "card1" };
                jest.spyOn(socketRouter, "verify").mockReturnValue(false);

                // Act
                socketRouter.handleCutCard(payload);

                // Assert
                expect(cutCardConsumer.consume).not.toHaveBeenCalled();
            });
        });

        describe("when verify succeeds", () => {
            it("should consume cut card", () => {
                // Arrange
                const payload = { card: "card1" };
                jest.spyOn(socketRouter, "verify").mockReturnValue(true);

                // Act
                socketRouter.handleCutCard(payload);

                // Assert
                expect(cutCardConsumer.consume).toHaveBeenCalledWith(gameData.realPlayers[socketClient.id], payload);
            });

            it("should log error if an exception occurs", () => {
                // Arrange
                const payload = { card: "card1" };
                const error = new Error("Test Error");
                jest.spyOn(socketRouter, "verify").mockReturnValue(true);
                cutCardConsumer.consume.mockImplementation(() => {
                    throw error;
                });

                // Act
                socketRouter.handleCutCard(payload);

                // Assert
                expect(logService.logError).toHaveBeenCalledWith(error);
            });
        });
    });

    describe("handleShoeVerification", () => {
        describe("when roundId is not provided", () => {
            it("should emit an error response", () => {
                // Arrange
                const payload = {};

                // Act
                socketRouter.handleShoeVerification(payload);

                // Assert
                expect(socketClient.emit).toHaveBeenCalledWith("testGame", { shoeVerification: { error: true } });
            });
        });

        describe("when roundId is provided", () => {
            it("should emit the shoe verification result", async () => {
                // Arrange
                const payload = { roundId: 1 };
                const result = { verification: true };
                shoeConsumer.getShoeVerification.mockResolvedValue(result);

                // Act
                await socketRouter.handleShoeVerification(payload);

                // Assert
                expect(socketClient.emit).toHaveBeenCalledWith("testGame", result);
            });

            it("should log error if an exception occurs", async () => {
                // Arrange
                const payload = { roundId: 1 };
                const error = new Error("Test Error");
                shoeConsumer.getShoeVerification.mockRejectedValue(error);

                // Act
                await socketRouter.handleShoeVerification(payload);

                // Assert
                expect(logService.logError).toHaveBeenCalledWith(error);
            });
        });
    });
});
