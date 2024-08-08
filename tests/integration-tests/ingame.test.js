import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
import { initUserSession } from "./init-user-session";

export const ingameTest = () => {
    describe("when user joins game", () => {
        it("should return ingame data", async () => {
            // Arrange
            const normalUserClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
            await normalUserClientDriver.handleSignedInEvent();
            console.log("signed in");
            await normalUserClientDriver.sendInGameEvent();

            // Act
            const actualResult = await normalUserClientDriver.handleGameEvent((data) => data.gameConfigs);

            // Assert
            expect(actualResult).not.toBeEmpty();
        });
    });
};
