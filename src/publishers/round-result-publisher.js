import { Core } from "sc-game-base";
import { decryptChain } from "../helpers/result-helper";

export default class RoundResultPublisher extends Core.BaseEventPublishers.BaseEventPublisher {
    publishRoundResult(roundResult) {
        const payload = { finish: roundResult };

        if (this.gameData.blockchain) {
            const payloadWithBlockchain = {
                finish: {
                    ...roundResult,
                    blockchain: decryptChain(this.gameData.blockchain),
                },
            };

            this.publishToAllUsers(payloadWithBlockchain);
            this.publishToAllAdmins(payloadWithBlockchain);
        } else {
            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }

    publishNewShoeHash() {
        if (this.gameData.blockchain) {
            const payload = {
                newBlockchain: decryptChain(this.gameData.blockchain),
            };

            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }
}
