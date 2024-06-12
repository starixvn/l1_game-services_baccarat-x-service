import { Table } from "sc-game-base";
import { Helpers } from "sc-card-game-base";

export default class InGameConsumer extends Table.EventConsumers.TableInGameConsumer {
    async buildPayload(realPlayer) {
        const payload = await super.buildPayload(realPlayer);
        payload.betPercentage = Helpers.ResultHelper.calculateBetUserPercentage(this.gameData.betUserCount);
        delete payload.resultHash;

        if (this.gameData.shoe) {
            const { cutCardIndex, burnedCards, cards, currentIndex } = this.gameData.shoe;
            return {
                ...payload,
                shoeInfo: {
                    cutCardIndex,
                    burnedCards,
                    firstCard: cards[0],
                    currentIndex,
                },
            };
        } else {
            return payload;
        }
    }
}
