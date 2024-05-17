import { GameData } from "sc-card-game-base";
import { MultipleGamesHttpRouter } from "sc-multiple-games-base";
import { ShoeConsumer } from "../consumers";

export default class HttpRouter extends MultipleGamesHttpRouter {
    /**
     * @param {Object} appConfigs
     * @param {GameData} gameData
     * @param {HistoryQuery} historyQuery
     * @param {metricQuery} metricQuery
     * @param {logger} dependencies.logService
     * @param {Object} definition
     * @param {ShoeConsumer} shoeConsumer
     */
    constructor(appConfigs, gameData, historyQuery, metricQuery, logService, definition, shoeConsumer) {
        super(appConfigs, gameData, historyQuery, metricQuery, logService, definition);

        this.shoeConsumer = shoeConsumer;
    }

    async handleShoeVerification(req, res) {
        try {
            const { roundId } = req.query;

            if (!roundId) {
                res.send({ error: true });
                return;
            }

            const result = await this.shoeConsumer.getShoeVerification(roundId);

            res.send(result);
        } catch (err) {
            this.logService.logError(err);
        }
    }

    init(app) {
        super.init(app);

        app.get(`/api/${this.definition.name}/shoeVerification/`, (_req, res) =>
            this.verifySession(_req, res, this.handleShoeVerification.bind(this))
        );
    }
}
