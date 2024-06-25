import { MultipleGamesSocketRouter } from "sc-multiple-games-base";

export default class SocketRouter extends MultipleGamesSocketRouter {
    constructor({
        definition,
        gameData,
        userSignInConsumer,
        inGameConsumer,
        placeBetConsumer,
        userDisconnectConsumer,
        userSignInPublisher,
        historyQuery,
        logService,
        playGamePermissionValidator,
        allGamesHistoryQuery,
        cutCardConsumer,
        shoeConsumer,
        roundQuery,
        gameResultServiceConsumer,
        rebetConsumer,
    }) {
        super({
            definition,
            gameData,
            userSignInConsumer,
            inGameConsumer,
            placeBetConsumer,
            userDisconnectConsumer,
            userSignInPublisher,
            historyQuery,
            logService,
            playGamePermissionValidator,
            allGamesHistoryQuery,
            roundQuery,
            gameResultServiceConsumer,
        });

        this.cutCardConsumer = cutCardConsumer;
        this.shoeConsumer = shoeConsumer;
        this.rebetConsumer = rebetConsumer;
    }

    init(socketClient) {
        super.init(socketClient);

        this.socketClient.on("cutCard", this.handleCutCard.bind(this));
        this.socketClient.on("shoeVerification", this.handleShoeVerification.bind(this));
        this.socketClient.on("rebet", this.handleRebet.bind(this));
    }

    handleCutCard(payload) {
        try {
            if (!this.verify()) {
                return;
            }

            this.cutCardConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    async handleShoeVerification(payload) {
        try {
            const { roundId } = payload;

            if (!roundId) {
                this.socketClient.emit(this.definition.name, { shoeVerification: { error: true } });
                return;
            }

            const result = await this.shoeConsumer.getShoeVerification(roundId);

            this.socketClient.emit(this.definition.name, result);
        } catch (err) {
            this.logService.logError(err);
        }
    }

    async handleRebet(payload) {
        try {
            if (!this.baseSocketRouter.verify()) {
                return;
            }

            this.rebetConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
