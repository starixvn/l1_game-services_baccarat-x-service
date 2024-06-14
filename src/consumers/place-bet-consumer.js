import { Consumers } from "sc-card-game-base";

export default class PlaceBetConsumer extends Consumers.PlaceBetConsumer {
    consume(player, payload) {
        super.consume(player, payload);

        const name = player.profile.name;
        if (this.gameData.ingame[name]) {
            this.gameData.ingame[name].currencyGroupId = player.session.currencyGroupId;
            this.gameData.ingame[name].maxBet = player.profile.maxBet;
        }
    }
}
