import { Core } from "sc-game-base";
import { initAPIStub, stubUserService, subGameManagementService } from "sc-game-service-integration-utils";

import appConfigs from "../../../src//app-configs.IGT";
import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";
import { TableGameData } from "sc-card-game-base";
import BaccaratGameDefinition from "../../../src/baccarat-game-definition";
import { mockGameSettings } from "../stubs/test-data";
import ContainerRegistry from "../../../src/container-registry";
import BaccaratxApp from "../../../src/baccaratx-app";

export const run = async () => {
    const definition = new BaccaratGameDefinition(mockGameSettings, generateResult, getSettlementResult);
    subGameManagementService(appConfigs, definition);
    initAPIStub(appConfigs.apiSettings.apiUrl);
    stubUserService(appConfigs);

    const gameData = new TableGameData(mockGameSettings.durations.wholeRound + mockGameSettings.durations.changingDeck);
    const container = new ContainerRegistry().register(appConfigs, definition, gameData);
    const app = new BaccaratxApp("BaccaratX", appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
