import { asClass, asValue } from "awilix";
import { Consumers, Publishers } from "sc-card-game-base";
import { MultipleTableGamesContainerRegistry } from "sc-multiple-games-base";
import { RebetContainerRegistry } from "sc-rebet-mode";
import {
    CutCardConsumer,
    InGameConsumer,
    MultiplierCardsConsumer,
    RoundResultConsumer,
    SettleGameRoundConsumer,
    ShoeConsumer,
} from "./consumers";
import { BaccaratXBot, BaccaratXGameCron, ProcessBetQueue } from "./crons";
import RoundResultPublisher from "./publishers/round-result-publisher";
import RoundQuery from "./query-apis/round-query";
import { HttpRouter, SocketRouter } from "./routers";

export default class ContainerRegistry extends MultipleTableGamesContainerRegistry {
    register(appConfigs, definition, gameData) {
        super.register(appConfigs, definition, gameData);

        this.registerRepositories(definition.repositories);
        this.registerRebetMode();
        return this.container;
    }

    registerRebetMode() {
        this.container.register(new RebetContainerRegistry().registerTableGame(SocketRouter));
        this.container.register({
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
            runningRoundInfoPublisher: asClass(Publishers.RunningRoundInfoPublisher).singleton(),
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
            inGameConsumer: asClass(InGameConsumer).singleton(),
        });
    }

    registerRepositories(repositories) {
        this.container.register({
            roundsRepository: asValue(repositories.roundsRepository),
            betsRepository: asValue(repositories.betsRepository),
            tempBetsRepository: asValue(repositories.tempBetsRepository),
            resultsRepository: asValue(repositories.resultsRepository),
            betLogsRepository: asValue(repositories.betLogsRepository),
            cutCardPFRepository: asValue(repositories.cutCardPFRepository),
            multipliersRepository: asValue(repositories.multipliersRepository),
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
            httpRouter: asClass(HttpRouter),
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
            roundQuery: asClass(RoundQuery).singleton(),
        });
    }
}
