import BaccaratGameDefinition from "./baccarat-game-definition";
import appConfigs from "./app-configs";
import BaccaratxApp from "./baccaratx-app";
import gameSettings from "./game-settings";

const run = async () => {
    const definitions = gameSettings.map((gameSetting) => new BaccaratGameDefinition(gameSetting));
    const app = new BaccaratxApp("Lucky Baccarat", appConfigs);
    await app.run();
    app.startGames(definitions);
};

run();
