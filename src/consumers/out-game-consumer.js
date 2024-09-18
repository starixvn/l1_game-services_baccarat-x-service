import { Core } from "sc-game-base";
import { Systems } from "sc-game-base/src/constants";

export default class OutGameConsumer extends Core.BaseEventConsumers.UserDisconnectConsumer {
    constructor(gameData, publisher) {
        super(gameData);

        this.publisher = publisher;
    }

    consume(socketClient) {
        const realPlayer = this.gameData.realPlayers[socketClient.id];

        if (realPlayer && this.gameData.players[realPlayer.UID]) {
            this.publisher.publishToAllUsersExceptSystem(Systems.Mobi, realPlayer.UID, { outgame: { playerId: realPlayer.UID } });
            delete this.gameData.players[realPlayer.UID];
        }

        super.consume(socketClient);
    }
}
