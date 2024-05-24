import { Core } from "sc-game-base";

export default class RoundResultPublisher extends Core.BaseEventPublishers.BaseEventPublisher {
    publishRoundResult(roundResult) {
        const payload = { finish: roundResult };

        this.publishToAllUsers(payload);
        this.publishToAllAdmins(payload);
    }

    publishNewShoeHash() {
        if (this.gameData.shoe) {
            const payload = {
                newShoeHash: this.gameData.shoe.hashValue,
            };

            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }

    publishFinalCutCardIndex() {
        const cutCardIndex = this.gameData.shoe?.cutCardIndex;
        if (cutCardIndex) {
            const payload = {
                cutCardIndex,
            };

            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }
}
