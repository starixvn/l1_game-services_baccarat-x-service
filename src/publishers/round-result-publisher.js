import { Core } from "sc-game-base";

export default class RoundResultPublisher extends Core.BaseEventPublishers.BaseEventPublisher {
    publishNewShoeHash() {
        if (this.gameData.shoe) {
            const payload = {
                newShoeHash: this.gameData.shoe.hashValue,
            };

            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }
}
