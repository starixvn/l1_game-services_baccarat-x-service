import { Core } from "sc-game-base";
import ContainerRegistry from "./container-registry";

export default class BaccaratxApp extends Core.BaseGameApp {
    startGames(definitions) {
        definitions.forEach(async (definition) => {
            const container = new ContainerRegistry().register(
                this.appConfigs,
                definition,
                new Core.GameData(definition.durations.wholeRound)
            );
            await this.startGame(container);
        });
    }
}
