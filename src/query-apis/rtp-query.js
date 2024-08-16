import BaccaratGameDefinition from "../baccarat-game-definition";
import HourlySummaryRepository from "../models/hourly-summaries";

export default class RTPQuery {
    /**
     * @param {HourlySummaryRepository} hourlySummariesRepository
     */
    constructor(hourlySummariesRepository) {
        this.hourlySummariesRepository = hourlySummariesRepository;
    }

    async getRTP(gameId) {
        const currentTime = new Date();
        const queryTime = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000);
        const summaries = await this.hourlySummariesRepository.find({ gameId }).lean().exec();

        const [totalStake, totalPayout] = summaries.reduce(
            (res, el) => {
                res[0] += el.stake;
                res[1] += el.payout;

                return res;
            },
            [0, 0]
        );

        return (totalStake / totalPayout) * 100;
    }
}
