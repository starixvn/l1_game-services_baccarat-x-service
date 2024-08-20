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
        rtpQuery,
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
        this.rtpQuery = rtpQuery;
    }

    init(socketClient) {
        super.init(socketClient);

        this.socketClient.on("cutCard", this.handleCutCard.bind(this));
        this.socketClient.on("shoeVerification", this.handleShoeVerification.bind(this));
        this.socketClient.on("lobbyInfo", this.getLobbyData.bind(this));
        this.socketClient.on("rtp", this.handleRTP.bind(this));
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

    async handleRTP() {
        try {
            if (!this.verify()) {
                return;
            }

            const rtp = await this.rtpQuery.getRTP(this.definition.id);
            this.socketClient.emit(this.definition.name, { rtp });
        } catch (error) {
            this.logService.logError(error);
        }
    }

    async getLobbyData() {
        try {
            if (!this.verify() || this.gameData.disabled) {
                return;
            }

            const result = {
                totalOnlineUsers: Object.keys(this.gameData.players).length,
                roundHistory: await this.roundQuery.getList(this.definition.numberOfRoundHistory),
                remainingTime: this.gameData.remainingTime,
                rtp: await this.rtpQuery.getRTP(this.definition.id),
                betLimit: this.getUserBetLimit(),
            };

            this.socketClient.emit(this.definition.name, result);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    getUserBetLimit() {
        const player = this.gameData.realPlayers[this.socketClient.id];

        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        return { minBet, maxBet };
    }
}
