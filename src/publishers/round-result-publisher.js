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
        if (this.gameData.shoe) {
            const { cutCardIndex, burnedCards, cards } = this.gameData.shoe;
            const payload = {
                shoeInfo: {
                    cutCardIndex,
                    burnedCards,
                    firstCard: cards[0],
                    new: true,
                },
            };

            this.publishToAllUsers(payload);
            this.publishToAllAdmins(payload);
        }
    }

    publishWinners(roundId, winningPlayers) {
        const payload = {
            roundId,
            winningPlayers,
        };

        this.publishToAllUsers({
            winners: payload,
        });
    }

    publishMultiplierCards(multiplierCards) {
        this.publishToAllUsers({ multiplierCards });
    }
}
