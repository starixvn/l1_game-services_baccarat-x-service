import { MultipleTableGamesHttpRouter } from "sc-multiple-games-base";
import { utils } from "sc-common";

export default class HttpRouter extends MultipleTableGamesHttpRouter {
    init(app) {
        super.init(app);

        app.post(
            `/api/${this.definition.name}/set_result`,
            utils.authentication.useAuthenticate({
                authUrl: this.appConfigs.apiSettings.authUrl,
                audiences: this.appConfigs.authenticateSettings.audiences,
            }),
            (req, res) => this.handleSetResult(req.body, res)
        );
    }

    handleSetResult(params, res) {
        try {
            if (!params || !params.result) {
                this.logService.logError("receives a result cheating call with invalid params.");
                res.send(false);

                return;
            }

            this.logService.logWarning(`receives a result cheating call for with the board as ${JSON.stringify(params.result)}.`);

            this.gameData.settlementResultFromAdmin = { result: params.result, roundId: params.roundId ?? this.gameData.roundId + 1 };

            res.send(true);
        } catch (error) {
            this.logService.logError(error);
            res.send(false);
        }
    }
}
