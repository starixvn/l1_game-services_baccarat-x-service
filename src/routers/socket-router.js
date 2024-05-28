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
        });

        this.cutCardConsumer = cutCardConsumer;
    }
    init(socketClient) {
        super.init(socketClient);

        this.socketClient.on("cutCard", this.handleCutCard.bind(this));
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
}
