import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
import { initUserSession } from "./init-user-session";

export const shoeVerificationTest = () => {
    describe("when user get shoe verification", () => {
        it("should return shoe verification info", async () => {
            // Arrange
            const client = new GameClientDriver(socketOptions, initUserSession(normalUser));
            await client.handleSignedInEvent();
            await client.sendInGameEvent();

            // Act
            await client.handleGameEvent((data) => data.remainingTime);
            client.emit("shoeVerification", { roundId: 1 });

            // Assert
            const betResult = await client.handleGameEvent((data) => data.shoeVerification);
            expect(betResult.shoeVerification).toBeTruthy();
        });
    });
};
