import { Core } from "sc-game-base";

export default class RoundQuery extends Core.QueryApis.RoundQuery {
    constructor(gameData, roundsRepository, resultsRepository) {
        super(roundsRepository, resultsRepository);
        this.gameData = gameData;
    }

    async getList(limit, projections) {
        const rounds = await this.roundsRepository
            .find({ id: { $gte: this.gameData.shoe.firstRoundId } }, projections, { sort: { _id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds.map((round) => {
            return {
                roundId: round.id,
                result: round.result,
                settlementResult: round.settlementResult,
                oddsMultipliers: round.oddsMultipliers,
                appliedMultipliers: round.appliedMultipliers,
                usedCardIndexes: round.usedCardIndexes,
            };
        });
    }
}
