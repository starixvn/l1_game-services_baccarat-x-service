import { Helpers } from "sc-card-game-base";
import { Table } from "sc-game-base";

export default class InGameConsumer extends Table.EventConsumers.TableInGameConsumer {
    async buildPayload(realPlayer) {
        const payload = await super.buildPayload(realPlayer);
        payload.betPercentage = Helpers.ResultHelper.calculateBetUserPercentage(this.gameData.betUserCount);
        payload.gameConfigs.extraFeeRatio = this.gameData.gameConfigs.oddsMultipliers.extraFeeRatio;
        delete payload.resultHash;

        if (this.gameData.shoe) {
            const { cutCardIndex, burnedCards, cards, currentIndex, firstRoundId, hashValue } = this.gameData.shoe;
            return {
                ...payload,
                shoeInfo: {
                    cutCardIndex,
                    burnedCards,
                    firstCard: cards[0],
                    currentIndex,
                    hashValue,
                    firstRound: this.gameData.roundId === firstRoundId,
                },
                oddsMultipliers: this.gameData.oddsMultipliers,
            };
        } else {
            return payload;
        }
    }
}
