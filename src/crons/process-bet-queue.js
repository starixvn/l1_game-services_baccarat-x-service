import { Crons } from "sc-card-game-base";

export default class ProcessBetQueue extends Crons.TableProcessBetQueue {
    formatApiBetInfo(payload) {
        const betInfo = super.formatApiBetInfo(payload);
        const { gameConfigs } = this.gameData;

        if (gameConfigs.applyMultiplier) {
            betInfo.amount += payload.amount * gameConfigs.oddsMultipliers.extraFeeRatio;
        }

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
        };

        if (configs.applyMultiplier) {
            const { oddsMultipliers } = configs;
            const extraFee = bet.amount * oddsMultipliers.extraFeeRatio;
            existingBetIncrement.fee = extraFee;
            existingBetIncrement.totalAmount += extraFee;
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
}
