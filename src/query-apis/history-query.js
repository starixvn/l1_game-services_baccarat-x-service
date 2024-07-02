import { Core } from "sc-game-base";

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    constructor(roundQuery, betsRepository, betLogsRepository, gameData) {
        super(roundQuery, betsRepository, betLogsRepository);

        this.gameData = gameData;
    }

    async queryHistory(player, page, pageSize) {
        const result = await super.queryHistory(player, page, pageSize);

        if (result.history) {
            for (const bet of result.history.betLogs) {
                bet.verifiable = bet.roundId < this.gameData.shoe.firstRoundId;
            }
        }

        return result;
    }
}
