import { TableGameData } from "sc-card-game-base";
import { Core } from "sc-game-base";
import ContainerRegistry from "./container-registry";
import { configureDatabase } from "./helpers/database-helper";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "sc-common";
import { init as initApis } from "sc-base-apis";
import mongoose from "mongoose";
import { startCorsCron, isAllowAccess } from "sc-game-base/src/core/helpers/cors-helper";
const { authenticationHelpers, chatBotHelper } = Core.Helpers;

export default class BaccaratxApp extends Core.BaseGameApp {
    startGames(definitions) {
        definitions.forEach(async (definition) => {
            const container = new ContainerRegistry().register(
                this.appConfigs,
                definition,
                new TableGameData(definition.durations.wholeRound)
            );
            await this.startGame(container);
        });
    }

    async configureServices(app) {
        const { disableCors } = this.appConfigs;
        const corsOptions = {
            origin: (origin, callback) => {
                if (disableCors || isAllowAccess(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`Not allowed by CORS ${origin}`));
                }
            },
        };

        app.use(cors(corsOptions));
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(morgan("combined"));
        app.use(helmet());
        app.set("port", process.env.PORT || this.appConfigs.hostingPort);

        if (this.appConfigs.enabledLogs) {
            logger.start(this.appConfigs.sentry);
        }

        await configureDatabase(mongoose, this.appConfigs.database);
        await initApis(this.appConfigs.apiSettings);
        await authenticationHelpers.init(this.appConfigs.authenticateSettings);
        chatBotHelper.init(this.appConfigs.chatBotSettings);
        !disableCors && startCorsCron(this.appConfigs);
    }
}
