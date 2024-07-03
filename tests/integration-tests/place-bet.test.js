import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
import { initUserSession } from "./init-user-session";
import { mockGameSettings } from "./stubs/test-data";

export const placeBetTest = () => {
    describe("when user place bet", () => {
        const getTimeOutToBet = (remainingTime, durations) => {
            let timeout = 0;
            if (remainingTime <= durations.lockingBet) {
                timeout = durations.wholeRound - durations.placingBets + remainingTime + 2;
            } else if (remainingTime >= durations.placingBets) {
                timeout = remainingTime - durations.placingBets + 2;
            }

            return timeout;
        };

        it("should return bet result", async () => {
            // Arrange
            const client = new GameClientDriver(socketOptions, initUserSession(normalUser));
            await client.handleSignedInEvent();
            await client.sendInGameEvent();

            // Act
            const { remainingTime } = await client.handleGameEvent((data) => data.remainingTime);

            await new Promise((resolve) => {
                setTimeout(() => {
                    client.emit("bet", { betChoice: "player", amount: 100 });
                    resolve();
                }, getTimeOutToBet(remainingTime, mockGameSettings.durations) * 1000);
            });

            // Assert
            const betResult = await client.handleGameEvent((data) => data.endBet);
            expect(betResult).toStrictEqual({
                betChoice: "player",
                freeBet: false,
                endBet: 120,
                ownBets: { player: 100, fee: 20 },
                ownChip: { betChoice: "player", amount: 100 },
                user: {
                    maxBet: 2000,
                    minBet: 1,
                    red: 24250,
                },
            });
        });
    });
};
