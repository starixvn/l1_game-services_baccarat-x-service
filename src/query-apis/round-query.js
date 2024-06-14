import { Core } from "sc-game-base";

export default class RoundQuery extends Core.QueryApis.RoundQuery {
    constructor(gameData, roundsRepository) {
        super(roundsRepository);
        this.gameData = gameData;
    }

    async getList(limit, projections) {
        const rounds = await this.roundsRepository
            .find({ id: { $gte: this.gameData.shoe.firstRoundId } }, projections, { sort: { _id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds.map((round) => {
            const result = round.result ?? this.convertResult(round);
            const settlementResult = round.settlementResult ?? this.convertSettlementResult(result);

            return {
                roundId: round.id,
                result,
                settlementResult,
                oddsMultipliers: round.oddsMultipliers,
                appliedMultipliers: round.appliedMultipliers,
            };
        });
    }
}
