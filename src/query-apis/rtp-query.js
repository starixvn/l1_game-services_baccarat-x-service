export default class RTPQuery {
    /**
     * @param {HourlySummaryRepository} hourlySummariesRepository
     */
    constructor(hourlySummariesRepository) {
        this.hourlySummariesRepository = hourlySummariesRepository;
    }

    async getRTP(gameId) {
        const currentTime = new Date();

        const summaries = await this.hourlySummariesRepository
            .find({ gameId, time: { $gte: new Date(currentTime.getTime() - 7200000) } }, { _id: false, stake: true, payout: true })
            .lean()
            .exec();

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
