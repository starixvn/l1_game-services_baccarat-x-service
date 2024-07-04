import { Consumers } from "sc-rebet-mode";

export default class RebetConsumer extends Consumers.RebetConsumer {
    async getLastBet(player) {
        const lastBet = await super.getLastBet(player);

        if (lastBet) {
            lastBet.totalAmount = lastBet.amount;
        }
    }
}
