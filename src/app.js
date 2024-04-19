import { GameDefinition } from "sc-multiple-games-base";
import appConfigs from "./app-configs";
import baccaratxApp from "./baccaratx-app";
import gameSettings from "./game-settings";

const run = async () => {
    const definitions = gameSettings.map((gameSetting) => new GameDefinition(gameSetting));
    const app = new baccaratxApp("Baccarat X", appConfigs);
    await app.run();
    app.startGames(definitions);
};

run();
