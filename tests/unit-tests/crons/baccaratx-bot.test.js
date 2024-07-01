import { helpers } from "sc-common";
import { Table } from "sc-game-base";
import { BaccaratXBot } from "../../../src/crons";

describe("baccaratXBot", () => {
    const definition = {
            minCutCardIndex: 1,
            maxCutCardIndex: 10,
            durations: { wholeRound: 60, changingDeck: 15 },
            choices: ["player", "banker", "tie", "playerPair", "bankerPair"],
            commonChoices: ["player", "banker", "tie"],
        },
        gameData = {
            gameConfigs: { choices_maxbet: { player: 1000, banker: 1000, tie: 500, playerPair: 200, bankerPair: 200 }, bot_maxbet: 500 },
            remainingTime: 60,
            betUserCount: {},
        },
        publisher = {},
        gameManagementApiClientFactory = { instance: jest.fn() },
        tempBetsRepository = {},
        cutCardConsumer = { insertPlayerCutCard: jest.fn() };
    let bot;

    beforeEach(() => {
        bot = new BaccaratXBot(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository, cutCardConsumer);

        bot.botsInRoom = {
            bot1: { name: "bot1", choices: [], betOnChoices: {}, totalBet: 0, remainTickets: 10 },
            bot2: { name: "bot2", choices: [], betOnChoices: {}, totalBet: 0, remainTickets: 10 },
        };

        bot.chance = { integer: jest.fn(), shuffle: jest.fn(), pickone: jest.fn() };
    });

    describe("contributeCutCard", () => {
        it("should call insertPlayerCutCard with the correct parameters", async () => {
            // Arrange
            const botInfo = { name: "bot1" };
            bot.chance.integer.mockReturnValueOnce(5);

            // Act
            await bot.contributeCutCard(botInfo);

            // Assert
            expect(cutCardConsumer.insertPlayerCutCard).toHaveBeenCalledWith("bot1", 5);
        });
    });

    describe("getBotsToCutCard", () => {
        it("should return a shuffled subset of bots in room", () => {
            // Arrange
            bot.chance.integer.mockReturnValueOnce(2);
            bot.chance.shuffle.mockReturnValueOnce([bot.botsInRoom.bot1, bot.botsInRoom.bot2]);

            // Act
            const result = bot.getBotsToCutCard();

            // Assert
            expect(result).toStrictEqual([bot.botsInRoom.bot1, bot.botsInRoom.bot2]);
        });
    });

    describe("startBotCutCard", () => {
        it("should call contributeCutCard for each bot selected", async () => {
            // Arrange
            jest.spyOn(bot, "getBotsToCutCard").mockReturnValue([bot.botsInRoom.bot1]);
            jest.spyOn(bot, "contributeCutCard").mockResolvedValue();

            // Act
            await bot.startBotCutCard();

            // Assert
            expect(bot.contributeCutCard).toHaveBeenCalledWith(bot.botsInRoom.bot1);
        });
    });

    describe("resetAllBotData", () => {
        it("should call resetAllBets", () => {
            // Arrange
            jest.spyOn(bot, "resetAllBets");

            // Act
            bot.resetAllBotData();

            // Assert
            expect(bot.resetAllBets).toHaveBeenCalled();
        });
    });

    describe("resetAllBets", () => {
        it("should reset allBets", () => {
            // Act
            bot.resetAllBets();

            // Assert
            expect(bot.allBets).toEqual({
                player: 0,
                banker: 0,
                tie: 0,
                playerPair: 0,
                bankerPair: 0,
            });
        });

        it("should reset smallTickets", () => {
            // Act
            bot.resetAllBets();

            // Assert
            expect(bot.smallTickets).toBe(0);
        });
    });

    describe("getBetChoice", () => {
        beforeEach(() => {
            jest.spyOn(bot, "getAllBetAmount").mockReturnValue(1000);
            jest.spyOn(bot, "getTotalAmountOnChoiceGroup").mockImplementation((group) => {
                if (group.includes("player") || group.includes("banker")) return 950;
                if (group.includes("playerPair") || group.includes("bankerPair")) return 20;
                if (group.includes("tie")) return 30;
                return 0;
            });
            jest.spyOn(helpers.arrayHelper, "shuffle").mockReturnValue([{ group: ["tie"], underBetRatio: true }]);
            jest.spyOn(bot, "getRandomChoiceFromGroup").mockReturnValue("tie");
        });

        it("should return a bet choice based on ratios", () => {
            // Arrange
            const botInfo = { choices: [] };

            // Act
            const choice = bot.getBetChoice(botInfo);

            // Assert
            expect(choice).toBe("tie");
        });

        it("should return previous unique choice if it exists", () => {
            // Arrange
            const botInfo = { choices: ["player"] };

            // Act
            const choice = bot.getBetChoice(botInfo);

            // Assert
            expect(choice).toBe("player");
        });
    });

    describe("getMaxBet", () => {
        it("should return correct max bet for player/banker choice", () => {
            // Arrange
            jest.spyOn(bot, "getMinBet").mockReturnValue(10);
            bot.totalTickets = 10;
            bot.smallTickets = 1;
            bot.smallTicketRatio = 0.2;

            // Act
            const maxBet = bot.getMaxBet(bot.botsInRoom.bot1, "player");

            // Assert
            expect(maxBet).toBe(500);
        });

        it("should return correct max bet for other choices", () => {
            // Arrange
            jest.spyOn(bot, "getMinBet").mockReturnValue(10);

            // Act
            const maxBet = bot.getMaxBet(bot.botsInRoom.bot1, "tie");

            // Assert
            expect(maxBet).toBe(100);
        });
    });

    describe("getRandomChoiceFromGroup", () => {
        it("should return a random choice from the group", () => {
            // Arrange
            bot.chance.pickone.mockReturnValue("player");

            // Act
            const choice = bot.getRandomChoiceFromGroup(["player", "banker"]);

            // Assert
            expect(choice).toBe("player");
        });
    });

    describe("getTotalAmountOnChoiceGroup", () => {
        it("should return the total amount bet on a choice group", () => {
            // Arrange
            bot.allBets = { player: 100, banker: 200, tie: 300 };

            // Act
            const total = bot.getTotalAmountOnChoiceGroup(["player", "banker"]);

            // Assert
            expect(total).toBe(300);
        });
    });

    describe("getTotalAmountOfBotOnChoiceGroup", () => {
        it("should return the total amount a bot bet on a choice group", () => {
            // Arrange
            const botInfo = { betOnChoices: { player: 50, banker: 50, tie: 0 } };

            // Act
            const total = bot.getTotalAmountOfBotOnChoiceGroup(botInfo, ["player", "banker"]);

            // Assert
            expect(total).toBe(100);
        });
    });

    describe("getAllBetAmount", () => {
        it("should return the total amount of all bets", () => {
            // Arrange
            bot.allBets = { player: 0, banker: 200, tie: 300, playerPair: 0, bankerPair: 100 };

            // Act
            const total = bot.getAllBetAmount();

            // Assert
            expect(total).toBe(600);
        });
    });

    describe("isSmallTicket", () => {
        it("should return true if amount is a small ticket", () => {
            // Arrange
            jest.spyOn(bot, "getMinBet").mockReturnValue(10);

            // Act
            const result = bot.isSmallTicket(500);

            // Assert
            expect(result).toBe(true);
        });

        it("should return false if amount is not a small ticket", () => {
            // Arrange
            jest.spyOn(bot, "getMinBet").mockReturnValue(10);

            // Act
            const result = bot.isSmallTicket(600);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("updateBotInRoomData", () => {
        it("should update bot total bet", () => {
            // Arrange
            jest.spyOn(bot, "isSmallTicket").mockReturnValue(true);
            bot.allBets = {};
            bot.smallTickets = 0;

            // Act
            bot.updateBotInRoomData(bot.botsInRoom.bot1, "player", 100, 500);

            // Assert
            expect(bot.allBets["player"]).toBe(100);
        });

        it("should update bot small ticket count", () => {
            // Arrange
            jest.spyOn(bot, "isSmallTicket").mockReturnValue(true);
            bot.allBets = {};
            bot.smallTickets = 0;

            // Act
            bot.updateBotInRoomData(bot.botsInRoom.bot1, "player", 100, 500);

            // Assert
            expect(bot.smallTickets).toBe(1);
        });
    });

    describe("convertAmountToChip", () => {
        it("should return the highest chip value that is less than or equal to the amount", () => {
            // Arrange
            const amount = 75;

            // Act
            const chip = bot.convertAmountToChip(amount);

            // Assert
            expect(chip).toBe(50);
        });
    });

    describe("getBotsToBet", () => {
        it("should return a shuffled subset of bots to bet", () => {
            // Arrange
            bot.chance.integer.mockReturnValue(5);
            bot.chance.shuffle.mockReturnValue([bot.botsInRoom.bot1, bot.botsInRoom.bot2]);

            // Act
            const result = bot.getBotsToBet();

            // Assert
            expect(result).toStrictEqual([bot.botsInRoom.bot1, bot.botsInRoom.bot2]);
        });
    });

    describe("shouldAddBot", () => {
        beforeEach(() => {
            bot.botsInRoom = {};
            bot.maxNumberOfBots = 4;
        });
        describe("when random value is 'in'", () => {
            describe("when NOT reach max bot", () => {
                it("should return true", () => {
                    // Act
                    const result = bot.shouldAddBot(bot.inOutValues.in);

                    // Assert
                    expect(result).toBe(true);
                });
            });
            describe("when reach max bot", () => {
                it("should return false", () => {
                    // Arrange
                    bot.botsInRoom = { bot1: {}, bot2: {}, bot3: {}, bot4: {}, bot5: {}, bot6: {} };

                    // Act
                    const result = bot.shouldAddBot("out");

                    // Assert
                    expect(result).toBe(false);
                });
            });
        });

        describe("when random value is NOT 'in'", () => {
            it("should return false if conditions are not met", () => {
                // Act
                const result = bot.shouldAddBot(bot.inOutValues.out);

                // Assert
                expect(result).toBe(false);
            });
        });
    });

    describe("updateBalanceAndPublishBetPayload", () => {
        beforeEach(() => {
            bot.gameData.betUserCount = {};
            jest.spyOn(Table.Crons.TableGameBot.prototype, "updateBalanceAndPublishBetPayload").mockImplementation(() => {});
        });
        it("should update bet user count", () => {
            // Act
            bot.updateBalanceAndPublishBetPayload("bot1", "player", 100, 500);

            // Assert
            expect(bot.gameData.betUserCount["player"]).toContain("bot1");
        });

        it("should call super method", () => {
            // Act
            bot.updateBalanceAndPublishBetPayload("bot1", "player", 100, 500);

            // Assert
            expect(Table.Crons.TableGameBot.prototype.updateBalanceAndPublishBetPayload).toHaveBeenCalledWith("bot1", "player", 100, 500);
        });
    });
});
