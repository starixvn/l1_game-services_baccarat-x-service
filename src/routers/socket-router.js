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
        this.socketClient.on("getLobbyData", this.getLobbyData.bind(this));
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

    async getLobbyData() {
        try {
            if (!this.verify() || this.gameData.disabled) {
                return;
            }

            const { firstRoundId } = this.gameData.shoe;
            const { remainingTime } = this.gameData;
            const { durations, defaultRTPPercentage } = this.definition;
            const rtp = await this.rtpQuery.getRTP(this.definition.id);

            const result = {
                totalOnlineUsers: Object.keys(this.gameData.players).length,
                roundHistory: await this.roundQuery.getList(this.definition.numberOfRoundHistory),
                remainingTime: this.gameData.remainingTime,
                rtp: rtp > defaultRTPPercentage ? rtp : defaultRTPPercentage,
                betLimit: this.getUserBetLimit(),
                newShoePhase:
                    this.gameData.roundId === firstRoundId &&
                    remainingTime > durations.placingBets + durations.dealCards &&
                    remainingTime <= durations.generatingShoe,
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
