import { Core } from "sc-game-base";
import { MultipleTableGamesContainerRegistry } from "sc-multiple-games-base";

export default class baccaratxApp extends Core.BaseGameApp {
    startGames(definitions) {
        definitions.forEach(async (definition) => {
            const container = new MultipleTableGamesContainerRegistry().register(
                this.appConfigs,
                definition,
                new Core.GameData(definition.durations.wholeRound)
            );
            await this.startGame(container);
        });
    }
}
