import { MultipleTableGamesHttpRouter } from "sc-multiple-games-base";
import { utils } from "sc-common";
import { HttpRouter } from "../../../src/routers";

describe("httpRouter", () => {
    let httpRouter, app, logService, gameData;

    beforeEach(() => {
        app = {
            post: jest.fn(),
        };
        logService = {
            logError: jest.fn(),
            logWarning: jest.fn(),
        };
        gameData = {
            roundId: 1,
            settlementResultFromAdmin: null,
        };

        httpRouter = new HttpRouter();
        httpRouter.appConfigs = {
            apiSettings: { authUrl: "http://auth.url" },
            authenticateSettings: { audiences: ["audience1"] },
        };
        httpRouter.definition = { name: "testGame" };
        httpRouter.logService = logService;
        httpRouter.gameData = gameData;

        jest.spyOn(MultipleTableGamesHttpRouter.prototype, "init").mockImplementation(() => {});
        jest.spyOn(utils.authentication, "useAuthenticate").mockImplementation(() => {});
    });

    describe("init", () => {
        it("should initialize app with authentication and route handler", () => {
            // Act
            httpRouter.init(app);

            // Assert
            expect(app.post).toHaveBeenCalledWith(
                `/api/testGame/set_result`,
                utils.authentication.useAuthenticate({
                    authUrl: "http://auth.url",
                    audiences: ["audience1"],
                }),
                expect.any(Function)
            );
        });
    });

    describe("handleSetResult", () => {
        describe("when params are invalid", () => {
            const res = { send: jest.fn() };
            const params = null;
            it("should log an error", () => {
                // Act
                httpRouter.handleSetResult(params, res);

                // Assert
                expect(logService.logError).toHaveBeenCalledWith("receives a result cheating call with invalid params.");
            });

            it("should log respond with false", () => {
                // Act
                httpRouter.handleSetResult(params, res);

                // Assert
                expect(res.send).toHaveBeenCalledWith(false);
            });
        });

        describe("when params are valid", () => {
            const res = { send: jest.fn() };
            const params = { result: "someResult" };

            it("should log a warning", () => {
                // Act
                httpRouter.handleSetResult(params, res);

                // Assert
                expect(logService.logWarning).toHaveBeenCalledWith('receives a result cheating call for with the board as "someResult".');
            });

            it("should respond with true", () => {
                // Act
                httpRouter.handleSetResult(params, res);
                expect(res.send).toHaveBeenCalledWith(true);
            });

            it("should assign settlementResultFromAdmin data", () => {
                // Act
                httpRouter.handleSetResult(params, res);

                // Assert
                expect(gameData.settlementResultFromAdmin).toEqual({ result: "someResult", roundId: 2 });
            });
        });
    });
});
