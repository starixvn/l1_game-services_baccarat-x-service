
import { Core } from "sc-game-base";

export default class UserBetResultPublisher extends Core.BaseEventPublishers.UserBetResultPublisher {
    async publish(userId, betResult) {
        const status = { winningByChoices: betResult.winningByChoices };

        if (betResult.totalWin > 0) {
            status.win = true;
            status.bet = betResult.totalWin;
            status.reachMaxWin = betResult.reachMaxWin;
        } else {
            status.win = false;
            status.bet = betResult.totalLost;
        }

        await this.publishToUser(userId, { status });
    }
}
