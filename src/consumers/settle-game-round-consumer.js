import { Consumers } from "sc-card-game-base";

export default class SettleGameRoundConsumer extends Consumers.TableSettleGameRoundConsumer {
    constructor({
        definition,
        gameData,
        roundResultPublisher,
        userBetResultPublisher,
        endGame,
        roundsRepository,
        betsRepository,
        gameManagementApiClientFactory,
        resultsRepository,
        multiplierCardsConsumer,
    }) {
        console.log(gameManagementApiClientFactory)
        super({
            definition,
            gameData,
            roundResultPublisher,
            userBetResultPublisher,
            endGame,
            roundsRepository,
            betsRepository,
            gameManagementApiClientFactory,
            resultsRepository,
        });

        this.multiplierCardsConsumer = multiplierCardsConsumer;
    }

    async settleRound() {
        const result = this.generateResult();
        const settlementResult = this.definition.settle(result);
        const { roundId, exchangeRates } = this.gameData;
        const oddsMultipliers = this.getOddsMultipliers();
        const appliedMultipliers = this.getAppliedMultipliers(oddsMultipliers, result, settlementResult);

        const newRound = await this.roundsRepository.create({
            id: roundId,
            result,
            settlementResult,
            time: new Date(),
            exchangeRateId: exchangeRates.exId,
            oddsMultipliers,
            appliedMultipliers,
        });

        if (newRound) {
            this.roundResultPublisher.publishRoundResult({
                ...this.collectRoundResult(result, settlementResult, roundId),
                oddsMultipliers,
                appliedMultipliers,
            });

            const finish = {
                settlementResult,
                result,
                roundId: newRound.id,
                time: newRound.time,
                oddsMultipliers,
                appliedMultipliers,
            };

            this.gameData.roundId = finish.roundId + 1;

            await this.settleBets(finish);

            this.roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers);
        }
    }

    getOddsMultipliers() {
        const { applyMultiplier } = this.gameData.gameConfigs;
        return applyMultiplier ? this.multiplierCardsConsumer.withdrawCards() : undefined;
    }

    getAppliedMultipliers(oddsMultipliers, result, settlementResult) {
        const { applyMultiplier } = this.gameData.gameConfigs;
        return applyMultiplier ? this.settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult) : undefined;
    }

    settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult) {
        const appliedMultipliers = [];
        const playerCards = Object.values(result.player);
        const bankerCards = Object.values(result.banker);

        const filterCards = (cards) => oddsMultipliers.filter((om) => cards.some((card) => card.rank === om.rank && card.suit === om.suit));

        if (settlementResult.tie || settlementResult.player || settlementResult.playerPair) {
            appliedMultipliers.push(filterCards(playerCards));
        }

        if (settlementResult.tie || settlementResult.banker || settlementResult.bankerPair) {
            appliedMultipliers.push(filterCards(bankerCards));
        }

        return appliedMultipliers;
    }

    settleOdds(result, settlementResult, appliedMultipliers) {
        const finalOdds = { ...this.gameData.gameConfigs.odds };

        if (this.gameData.gameConfigs.applyMultiplier) {
            const filterCards = (cards) =>
                appliedMultipliers.filter((om) => cards.some((card) => card.rank === om.rank && card.suit === om.suit));

            const appliedPlayerCards = filterCards(result.player);
            const appliedBankerCards = filterCards(result.banker);

            if (settlementResult.tie) {
                finalOdds.tie *= this.calculateMultiplierCards(appliedMultipliers);
            } else {
                if (settlementResult.player) {
                    finalOdds.player *= this.calculateMultiplierCards(appliedPlayerCards);
                }
                if (settlementResult.banker) {
                    finalOdds.banker *= this.calculateMultiplierCards(appliedBankerCards);
                }
            }

            if (settlementResult.playerPair) {
                finalOdds.playerPair *= this.calculateMultiplierCards(appliedPlayerCards);
            }

            if (settlementResult.bankerPair) {
                finalOdds.bankerPair *= this.calculateMultiplierCards(appliedBankerCards);
            }
        }

        return finalOdds;
    }

    calculateMultiplierCards(cards) {
        return cards.reduce((acc, curr) => acc * curr.value, 1);
    }

    async settleBets({ result, settlementResult, roundId, time, appliedMultipliers }) {
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            const odds = this.settleOdds(result, settlementResult, appliedMultipliers);

            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    calculateBetResult(settlementResult, bet, odds) {
        const betResult = super.calculateBetResult(settlementResult, bet, odds);

        if (settlementResult.tie) {
            betResult.totalWin += bet.player + bet.banker;
        }

        return betResult;
    }
}
