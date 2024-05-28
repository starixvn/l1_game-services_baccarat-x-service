import { asClass, asValue } from "awilix";
import { Consumers } from "sc-card-game-base";
import { MultipleTableGamesContainerRegistry } from "sc-multiple-games-base";
import { CutCardConsumer, MultiplierCardsConsumer, RoundResultConsumer, SettleGameRoundConsumer, ShoeConsumer } from "./consumers";
import { BaccaratXBot, BaccaratXGameCron, ProcessBetQueue } from "./crons";
import RoundResultPublisher from "./publishers/round-result-publisher";
import { SocketRouter } from "./routers/socket-router";

export default class ContainerRegistry extends MultipleTableGamesContainerRegistry {
    register(appConfigs, definition, gameData) {
        super.register(appConfigs, definition, gameData);

        this.registerRepositories(definition.repositories);

        return this.container;
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            shoeConsumer: asClass(ShoeConsumer).singleton(),
            cutCardConsumer: asClass(CutCardConsumer).singleton(),
            multiplierCardsConsumer: asClass(MultiplierCardsConsumer).singleton(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            unsettledRoundConsumer: asClass(Consumers.UnsettledRoundConsumer).singleton().proxy(),
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

    registerCrons() {
        super.registerCrons();

        this.container.register({
            gameCron: asClass(BaccaratXGameCron).singleton().proxy(),
            bot: asClass(BaccaratXBot).singleton(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }
}
