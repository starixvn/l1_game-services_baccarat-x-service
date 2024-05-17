import { asClass, asValue } from "awilix";
import { MultipleTableGamesContainerRegistry } from "sc-multiple-games-base";
import { ShoeConsumer, CutCardConsumer, MultiplierCardsConsumer, RoundResultConsumer, SettleGameRoundConsumer } from "./consumers";

export default class ContainerRegistry extends MultipleTableGamesContainerRegistry {
    register(appConfigs, definition, gameData) {
        super.register(appConfigs, definition, gameData);

        this.registerRepositories(definition.repositories);

        return this.container;
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            shoeConsumer: asClass(ShoeConsumer).singleton(),
            cutCardConsumer: asClass(CutCardConsumer).singleton(),
            multiplierCardsConsumer: asClass(MultiplierCardsConsumer).singleton(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton(),
        });
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
