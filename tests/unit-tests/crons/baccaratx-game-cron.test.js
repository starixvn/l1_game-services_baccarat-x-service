import { GameData } from "sc-card-game-base";
import { GameCron } from "sc-card-game-base/src/crons";
import { BaccaratXGameCron } from "../../../src/crons";

describe("baccaratXGameCron", () => {
    const mockDependencies = {
        definition: {},
        gameData: new GameData(),
        bot: {
            reset: jest.fn(),
            run: jest.fn(),
            startBotCutCard: jest.fn(),
        },
        settleGameRoundConsumer: { settleRound: jest.fn(), generateResult: jest.fn() },
        gameStatusPublisher: { publishStartPlacingBetStatus: jest.fn(), publishEndPlacingBetStatus: jest.fn() },
        runningRoundInfoPublisher: { publish: jest.fn() },
        logService: { logError: jest.fn() },
        roundResultConsumer: {
            updateAndPublishFinalCutCardIndex: jest.fn(),
            checkSufficientChain: jest.fn(),
            generateAndPublishHash: jest.fn(),
        },
        resultsRepository: {
            findOne: jest.fn(),
            updateOne: jest.fn(),
        },
        appConfigs: { enabledBoostedOdds: true },
        gameManagementApiClientFactory: { instance: jest.fn() },
        roundIdConsumer: { initRoundId: jest.fn() },
        provablyFairConsumer: {},
        unsettledRoundConsumer: { proceed: jest.fn() },
        cutCardConsumer: {},
        shoeConsumer: { decryptShoe: jest.fn() },
        multiplierCardsConsumer: { queryCurrentRoundMultiplierResult: jest.fn(), generate: jest.fn() },
        roundResultPublisher: { publishNewShoeHash: jest.fn(), publishMultiplierCards: jest.fn(), publishFinalCutCardIndex: jest.fn() },
    };
    let baccaratXGameCron;

    beforeEach(() => {
        baccaratXGameCron = new BaccaratXGameCron({ ...mockDependencies });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("start", () => {
        describe("when starting the cron", () => {
            beforeEach(() => {
                jest.spyOn(baccaratXGameCron, "queryLastResult").mockResolvedValue();
                jest.spyOn(baccaratXGameCron, "getSettingForNewRound").mockResolvedValue();
                jest.spyOn(baccaratXGameCron, "updateExchangeRates").mockResolvedValue();
                jest.spyOn(baccaratXGameCron, "initShoe").mockResolvedValue();
                jest.spyOn(baccaratXGameCron, "initNewRound").mockResolvedValue();
                jest.spyOn(baccaratXGameCron, "startCron").mockResolvedValue();
            });

            it("should initialize roundId", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.roundIdConsumer.initRoundId).toHaveBeenCalled();
            });

            it("should query last result", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.queryLastResult).toHaveBeenCalled();
            });

            it("should get settings for new round", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.getSettingForNewRound).toHaveBeenCalled();
            });

            it("should update exchange rates", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.updateExchangeRates).toHaveBeenCalled();
            });

            it("should initialize shoe", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.initShoe).toHaveBeenCalled();
            });

            it("should initialize new round", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.initNewRound).toHaveBeenCalled();
            });

            it("should proceed with unsettled rounds", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.unsettledRoundConsumer.proceed).toHaveBeenCalled();
            });

            it("should start cron", async () => {
                // Act
                await baccaratXGameCron.start();

                // Assert
                expect(baccaratXGameCron.startCron).toHaveBeenCalled();
            });
        });
    });

    describe("queryLastResult", () => {
        describe("when querying last result", () => {
            beforeEach(() => {
                jest.spyOn(GameCron.prototype, "queryLastResult").mockResolvedValue();
            });

            it("should call super.queryLastResult", async () => {
                // Act
                await baccaratXGameCron.queryLastResult();

                // Assert
                expect(GameCron.prototype.queryLastResult).toHaveBeenCalled();
            });

            it("should call multiplierCardsConsumer.queryCurrentRoundMultiplierResult", async () => {
                // Act
                await baccaratXGameCron.queryLastResult();

                // Assert
                expect(baccaratXGameCron.multiplierCardsConsumer.queryCurrentRoundMultiplierResult).toHaveBeenCalled();
            });
        });
    });

    describe("initShoe", () => {
        describe("when results exist", () => {
            const mockResults = { shoe: { encryptedShoe: "encryptedShoe" }, isAvailable: true, firstRoundId: 1 };
            const mockDecryptedShoe = { cards: ["card1"], rawValue: "rawValue", hashValue: "hashValue" };

            beforeEach(() => {
                jest.spyOn(baccaratXGameCron.resultsRepository, "findOne").mockReturnValue({
                    lean: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(mockResults),
                });
                baccaratXGameCron.shoeConsumer.decryptShoe.mockReturnValue(mockDecryptedShoe);
            });

            it("should find the latest available results", async () => {
                // Act
                await baccaratXGameCron.initShoe();

                // Assert
                expect(baccaratXGameCron.resultsRepository.findOne).toHaveBeenCalledWith({ isAvailable: true }, null, {
                    sort: { time: -1 },
                });
            });

            it("should decrypt the shoe data", async () => {
                // Act
                await baccaratXGameCron.initShoe();

                // Assert
                expect(baccaratXGameCron.shoeConsumer.decryptShoe).toHaveBeenCalledWith(mockResults.shoe);
            });

            it("should set gameData.shoe with decrypted shoe data", async () => {
                // Act
                await baccaratXGameCron.initShoe();

                // Assert
                expect(baccaratXGameCron.gameData.shoe).toEqual({ ...mockResults, ...mockDecryptedShoe });
            });
        });

        describe("when no results found", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.shoe = undefined;
                jest.spyOn(baccaratXGameCron.resultsRepository, "findOne").mockReturnValue({
                    lean: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(null),
                });
            });

            it("should attempt to find the latest available results", async () => {
                // Act
                await baccaratXGameCron.initShoe();

                // Assert
                expect(baccaratXGameCron.resultsRepository.findOne).toHaveBeenCalledWith({ isAvailable: true }, null, {
                    sort: { time: -1 },
                });
            });

            it("should not set gameData.shoe", async () => {
                // Act
                await baccaratXGameCron.initShoe();

                // Assert
                expect(baccaratXGameCron.gameData.shoe).toBeUndefined();
            });
        });
    });

    describe("proceed", () => {
        const durations = {
            generatingShoe: 10,
            generatingCutCardIndex: 5,
            placingBets: 3,
            lockingBet: 2,
        };

        beforeEach(() => {
            baccaratXGameCron.definition.durations = durations;
            baccaratXGameCron.gameData.isNewRound = true;
            baccaratXGameCron.gameData.disabled = false;
            baccaratXGameCron.gameData.remainingTime = durations.generatingShoe;
            baccaratXGameCron.startNewShoe = jest.fn();

            jest.spyOn(baccaratXGameCron, "checkGameStatus").mockResolvedValue();
            jest.spyOn(baccaratXGameCron, "resetForNewRound").mockReturnValue();
            jest.spyOn(baccaratXGameCron.bot, "reset").mockResolvedValue();
            jest.spyOn(baccaratXGameCron, "updatePromotionOddsAndNotify").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.settleGameRoundConsumer, "settleRound").mockResolvedValue();
            jest.spyOn(baccaratXGameCron, "initNewRound").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.bot, "run").mockReturnValue();
            jest.spyOn(baccaratXGameCron.runningRoundInfoPublisher, "publish").mockReturnValue();
            jest.spyOn(baccaratXGameCron.gameStatusPublisher, "publishStartPlacingBetStatus").mockReturnValue();
            jest.spyOn(baccaratXGameCron.gameStatusPublisher, "publishEndPlacingBetStatus").mockReturnValue();
            jest.spyOn(baccaratXGameCron.multiplierCardsConsumer, "generate").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.roundResultPublisher, "publishMultiplierCards").mockReturnValue();
        });

        describe("when the game is a new round and game is not disabled", () => {
            it("should check the game status", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.checkGameStatus).toHaveBeenCalled();
            });

            it("should set isNewRound to false if the game is not disabled", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.gameData.isNewRound).toBe(false);
            });
        });

        describe("when remaining time equals generatingShoe duration", () => {
            it("should start a new shoe", async () => {
                jest.spyOn(baccaratXGameCron, "startNewShoe").mockResolvedValue();
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.startNewShoe).toHaveBeenCalled();
            });
        });

        describe("when remaining time equals generatingCutCardIndex duration and firstRoundId equals roundId", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.remainingTime = durations.generatingCutCardIndex + 1;
                baccaratXGameCron.gameData.shoe = { firstRoundId: 1 };
                baccaratXGameCron.gameData.roundId = 1;
                jest.spyOn(baccaratXGameCron.roundResultConsumer, "updateAndPublishFinalCutCardIndex").mockResolvedValue();
            });

            it("should update and publish final cut card index", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.roundResultConsumer.updateAndPublishFinalCutCardIndex).toHaveBeenCalled();
            });
        });

        describe("when remaining time equals placingBets duration", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.remainingTime = durations.placingBets + 1;
            });

            it("should publish start placing bet status", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.gameStatusPublisher.publishStartPlacingBetStatus).toHaveBeenCalled();
            });
        });

        describe("when remaining time equals lockingBet - 1 duration", () => {
            beforeEach(() => {
                baccaratXGameCron.generateAndPublishOddsMultipliers = jest.fn();
                baccaratXGameCron.gameData.remainingTime = durations.lockingBet - 1 + 1;
            });

            it("should call generateAndPublishOddsMultipliers", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.generateAndPublishOddsMultipliers).toHaveBeenCalled();
            });

            it("should publish end placing bet status", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.gameStatusPublisher.publishEndPlacingBetStatus).toHaveBeenCalled();
            });
        });

        describe("when remaining time is less than 0", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.remainingTime = 0;
                baccaratXGameCron.settleGameRoundConsumer.generateResult.mockReturnValueOnce({ result: {}, usedCardIndexes: 4 });
            });

            it("should generate result", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.settleGameRoundConsumer.generateResult).toHaveBeenCalled();
            });

            it("should settle the game round", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.settleGameRoundConsumer.settleRound).toHaveBeenCalled();
            });

            it("should initialize a new round", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.initNewRound).toHaveBeenCalled();
            });
        });

        describe("when remaining time is less than placingBets duration", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.remainingTime = durations.placingBets - 1;
            });

            it("should run the bot", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.bot.run).toHaveBeenCalled();
            });

            it("should publish running round info", async () => {
                // Act
                await baccaratXGameCron.proceed();

                // Assert
                expect(baccaratXGameCron.runningRoundInfoPublisher.publish).toHaveBeenCalled();
            });
        });
    });

    describe("startNewShoe", () => {
        beforeEach(() => {
            jest.spyOn(baccaratXGameCron, "resetForNewRound").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.roundResultConsumer, "generateAndPublishHash").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.bot, "startBotCutCard").mockReturnValue();
        });

        it("should reset for new round when changing shoe", async () => {
            // Act
            await baccaratXGameCron.startNewShoe();

            // Assert
            expect(baccaratXGameCron.resetForNewRound).toHaveBeenCalled();
        });

        it("should call roundResultConsumer.generateAndPublishHash", async () => {
            // Act
            await baccaratXGameCron.startNewShoe();

            // Assert
            expect(baccaratXGameCron.roundResultConsumer.generateAndPublishHash).toHaveBeenCalled();
        });

        it("should start the bot to cut the card", async () => {
            // Act
            await baccaratXGameCron.startNewShoe();

            // Assert
            expect(baccaratXGameCron.bot.startBotCutCard).toHaveBeenCalled();
        });
    });

    describe("generateAndPublishOddsMultipliers", () => {
        beforeEach(() => {
            baccaratXGameCron.gameData.gameConfigs.applyMultiplier = true;
            jest.spyOn(baccaratXGameCron.multiplierCardsConsumer, "generate").mockResolvedValue();
            jest.spyOn(baccaratXGameCron.roundResultPublisher, "publishMultiplierCards").mockReturnValue();
        });

        describe("when applyMultiplier is true", () => {
            it("should generate odds multipliers", async () => {
                // Act
                await baccaratXGameCron.generateAndPublishOddsMultipliers();

                // Assert
                expect(baccaratXGameCron.multiplierCardsConsumer.generate).toHaveBeenCalled();
            });

            it("should publish multiplier cards", async () => {
                // Act
                await baccaratXGameCron.generateAndPublishOddsMultipliers();

                // Assert
                expect(baccaratXGameCron.roundResultPublisher.publishMultiplierCards).toHaveBeenCalledWith(
                    baccaratXGameCron.gameData.oddsMultipliers
                );
            });
        });

        describe("when applyMultiplier is false", () => {
            beforeEach(() => {
                baccaratXGameCron.gameData.gameConfigs.applyMultiplier = false;
            });

            it("should not generate odds multipliers", async () => {
                // Act
                await baccaratXGameCron.generateAndPublishOddsMultipliers();

                // Assert
                expect(baccaratXGameCron.multiplierCardsConsumer.generate).not.toHaveBeenCalled();
            });

            it("should not publish multiplier cards", async () => {
                // Act
                await baccaratXGameCron.generateAndPublishOddsMultipliers();

                // Assert
                expect(baccaratXGameCron.roundResultPublisher.publishMultiplierCards).not.toHaveBeenCalled();
            });
        });
    });

    describe("getWholeRoundByChainStatus", () => {
        const durations = {
            wholeRound: 60,
            changingDeck: 15,
        };

        beforeEach(() => {
            baccaratXGameCron.definition.durations = durations;
            jest.spyOn(baccaratXGameCron.roundResultConsumer, "checkSufficientChain").mockResolvedValue({ isSufficient: true });
        });

        it("should return wholeRound duration if chain is sufficient", async () => {
            // Act
            const result = await baccaratXGameCron.getWholeRoundByChainStatus();

            // Assert
            expect(result).toBe(durations.wholeRound);
        });

        it("should return wholeRound + changingDeck duration if chain is not sufficient", async () => {
            // Arrange
            baccaratXGameCron.roundResultConsumer.checkSufficientChain.mockResolvedValue({ isSufficient: false });

            // Act
            const result = await baccaratXGameCron.getWholeRoundByChainStatus();

            // Assert
            expect(result).toBe(durations.wholeRound + durations.changingDeck);
        });
    });
});
