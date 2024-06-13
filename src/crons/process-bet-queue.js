import { Crons } from "sc-card-game-base";

export default class ProcessBetQueue extends Crons.TableProcessBetQueue {
    async proceedBet(player, payload) {
        payload.fee = this.setExtraFee(payload);

        return super.proceedBet(player, payload);
    }

    setExtraFee(payload) {
        const { gameConfigs } = this.gameData;

        if (gameConfigs.applyMultiplier) {
            return payload.amount * gameConfigs.oddsMultipliers.extraFeeRatio;
        }

        return 0;
    }

    formatApiBetInfo(payload) {
        const betInfo = super.formatApiBetInfo(payload);
        betInfo.amount += payload.fee;

        return betInfo;
    }

    async upsertBet(player, roundId, bet, rate) {
        const configs = this.gameData.gameConfigs;
        const newBet = {
            uid: player.UID,
            name: player.profile.name,
            time: new Date(),
            odds: configs.odds,
            freeBet: bet.freeBet,
            roundId,
            clientSeed: bet.clientSeed,
        };
        const existingBetFilter = { uid: player.UID, roundId, freeBet: bet.freeBet };
        const existingBetIncrement = {
            [bet.betChoice]: bet.amount,
            totalAmount: bet.amount,
            amount: bet.amount,
        };

        if (configs.applyMultiplier) {
            existingBetIncrement.fee = bet.fee;
            existingBetIncrement.totalAmount += bet.fee;
        }

        if (player.session) {
            newBet.siteId = player.session.siteId;
            newBet.currency = player.session.currencyName;
            newBet.rate = rate;

            newBet.operatorId = player.session.operatorId;
            newBet.playerId = player.session.playerId;
        }

        await this.betsRepository.updateOne(
            existingBetFilter,
            { $inc: existingBetIncrement, $setOnInsert: newBet },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return newBet.time;
    }

    async insertBetLog(player, roundId, bet, rate) {
        const newBetLog = {
            uid: player.UID,
            name: player.profile.name,
            time: new Date(),
            choice: bet.betChoice,
            amount: bet.amount,
            freeBet: bet.freeBet,
            clientSentTime: bet.clientSentTime,
            receivedTime: bet.receivedTime,
            roundId,
            fee: bet.fee,
        };

        if (player.session) {
            newBetLog.siteId = player.session.siteId;
            newBetLog.currency = player.session.currencyName;
            newBetLog.rate = rate;

            newBetLog.operatorId = player.session.operatorId;
            newBetLog.playerId = player.session.playerId;
        }

        await this.betLogsRepository.create(newBetLog);
    }

    adjustOwnBets(playerName, bet) {
        super.adjustOwnBets(playerName, bet);

        if (this.gameData.ingame?.[playerName]) {
            const playerInGame = this.gameData.ingame[playerName];
            playerInGame.ownBets.fee = (playerInGame.ownBets.fee ?? 0) + bet.fee;
        }
    }

    generatePlacingBetResult(player, balance, bet, rate) {
        const result = super.generatePlacingBetResult(player, balance, bet, rate);
        const { fee } = bet;
        result.endBet += fee;

        return result;
    }
}
