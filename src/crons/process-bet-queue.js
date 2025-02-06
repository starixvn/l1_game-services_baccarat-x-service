import { Crons } from "sc-rebet-mode";

export default class ProcessBetQueue extends Crons.TableProcessBetQueueSeparateBetLog {
    async proceedBet(player, payload) {
        if (payload.rebet) {
            payload.amount = this.calculateRebetTotalAmount(payload.lastBet);
        }

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

    calculateRebetTotalAmount(rebet) {
        let totalAmount = 0;

        for (const amount of Object.values(rebet)) {
            totalAmount += amount;
        }

        return totalAmount;
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
            rebet: bet.rebet,
            maxWin: this.getMaxWinPerRound(player),
        };
        const existingBetFilter = { uid: player.UID, roundId, freeBet: bet.freeBet };
        let existingBetIncrement = {
            totalAmount: bet.amount + bet.fee,
            fee: bet.fee,
            amount: bet.amount,
        };

        if (bet.rebet) {
            existingBetIncrement = this.rebetProcessor.assignAmountToChoice(existingBetIncrement, bet.lastBet);
        } else {
            existingBetIncrement[bet.betChoice] = bet.amount;
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
        const betLogs = [];

        if (bet.rebet) {
            const { receivedTime, clientSentTime } = bet;
            for (const [betChoice, amount] of Object.entries(bet.lastBet)) {
                const betLog = { betChoice, amount, receivedTime, clientSentTime };
                betLog.fee = this.setExtraFee(betLog);

                betLogs.push(this.createBetLogModel(player, roundId, betLog, rate, true));
            }
        } else {
            betLogs.push(this.createBetLogModel(player, roundId, bet, rate, false));
        }

        await this.betLogsRepository.insertMany(betLogs);
    }

    createBetLogModel(player, roundId, bet, rate, rebet) {
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
            rebet,
        };

        if (player.session) {
            newBetLog.siteId = player.session.siteId;
            newBetLog.currency = player.session.currencyName;
            newBetLog.rate = rate;

            newBetLog.operatorId = player.session.operatorId;
            newBetLog.playerId = player.session.playerId;
        }

        return newBetLog;
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
        result.endBet += bet.fee;

        return result;
    }

    getMaxWinPerRound(player) {
        const { maxWinPerRound } = this.gameData.gameConfigs;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        return maxWinPerRound * maxBet;
    }

    adjustTotalBets(player, bet, rate) {
        super.adjustTotalBets(player, bet, rate);

        if (bet.rebet) {
            const { lastBet } = bet;
            Object.entries(lastBet).forEach(([betChoice, amount]) => this.updateBetUserCount(player, { betChoice, amount }));
        } else {
            this.updateBetUserCount(player, bet);
        }
    }

    updateBetUserCount(player, bet) {
        const { betChoice } = bet;
        if (this.definition.commonChoices.includes(betChoice)) {
            if (!this.gameData.betUserCount[betChoice]) {
                this.gameData.betUserCount[betChoice] = [];
            }
            this.gameData.betUserCount[betChoice].push(player.UID);
        }
    }

    isCountOnTotalBets(player) {
        console.log(
            this.gameData.currencies.filter(
                (currency) => currency.partnerId === player.session.operatorId && currency.name === player.session.currencyName
            )
        );

        return super.isCountOnTotalBets(player);
    }
}
