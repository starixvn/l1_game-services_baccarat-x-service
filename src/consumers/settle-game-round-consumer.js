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
        console.log(gameManagementApiClientFactory);
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
        const oddsMultipliers = this.generateOddsMultipliers();
        const appliedMultipliers = this.settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult);

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

    generateOddsMultipliers() {
        const { applyMultiplier } = this.gameData.gameConfigs;
        return applyMultiplier ? this.multiplierCardsConsumer.withdrawCards() : undefined;
    }

    settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult) {
        const { applyMultiplier } = this.gameData.gameConfigs;

        if (!applyMultiplier) {
            return undefined;
        }

        const appliedMultiplierCards = [];
        const playerCards = Object.values(result.player);
        const bankerCards = Object.values(result.banker);

        const filterCards = (cards) => oddsMultipliers.filter((om) => cards.some((card) => card.rank === om.rank && card.suit === om.suit));

        if (settlementResult.tie) {
            appliedMultiplierCards.push(...filterCards([...playerCards, ...bankerCards]));
        } else {
            if (settlementResult.player || settlementResult.playerPair) {
                appliedMultiplierCards.push(...filterCards(playerCards));
            }

            if (settlementResult.banker || settlementResult.bankerPair) {
                appliedMultiplierCards.push(...filterCards(bankerCards));
            }
        }

        return appliedMultiplierCards;
    }

    settleOdds(result, settlementResult, appliedMultipliers) {
        const finalOdds = { ...this.gameData.gameConfigs.odds };

        if (this.gameData.gameConfigs.applyMultiplier) {
            const filterCards = (cards) =>
                appliedMultipliers.filter((om) => cards.some((card) => card.rank === om.rank && card.suit === om.suit));

            const appliedPlayerCards = filterCards(Object.values(result.player));
            const appliedBankerCards = filterCards(Object.values(result.banker));

            const appliedCardsPerChoice = {
                player: appliedPlayerCards,
                banker: appliedBankerCards,
                tie: appliedMultipliers,
                playerPair: appliedPlayerCards,
                bankerPair: appliedBankerCards,
            };

            Object.entries(settlementResult).forEach(([choice, win]) => {
                if (win) {
                    finalOdds[choice] *= this.calculateOdds(appliedCardsPerChoice[choice]);
                }
            });
        }

        return finalOdds;
    }

    calculateOdds(cards) {
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

        const { gameConfigs } = this.gameData;
        betResult.totalWin = Math.min(betResult.totalWin, gameConfigs.maxWinPerRound);

        return betResult;
    }
}
