import { MultipleTableGamesContainerRegistry } from "sc-multiple-games-base";

export default class ContainerRegistry extends MultipleTableGamesContainerRegistry {
    register(appConfigs, definition, gameData) {
        super.register(appConfigs, definition, gameData);

        this.registerRepositories(definition.repositories);

        return this.container;
    }

    registerRepositories(repositories) {
        this.container.register({
            roundsRepository: asValue(repositories.roundsRepository),
            betsRepository: asValue(repositories.betsRepository),
            resultsRepository: asValue(repositories.resultsRepository),
            betLogsRepository: asValue(repositories.betLogsRepository),
            cutCardPFRepository: asValue(repositories.cutCardPFRepository),
            allGamesBetsRepository: asValue(repositories.allGamesBetsRepository),
        });
    }
}
