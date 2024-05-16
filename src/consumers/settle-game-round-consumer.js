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

    async generateResult() {
        const { result, usedCardsCount } = this.definition.generateResult(this.gameData.shoe);
        this.gameData.blockchain.currentIndex = this.gameData.blockchain.currentIndex + usedCardsCount;
        this.gameData.blockchain.remainingCards = this.definition.maxCardsPerRound - usedCardsCount;
        await this.resultsRepository.update(
            { _id: this.gameData.blockchain._id },
            {
                $set: {
                    currentIndex: this.gameData.blockchain.currentIndex,
                    remainingCards: this.gameData.blockchain.remainingCards,
                },
            }
        );

        return result;
    }

    async settleRound() {
        const result = this.generateResult(this.gameData.shoe);
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
            return;
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

    settleOdds(settlementResult, appliedCardsPerChoice) {
        const finalOdds = { ...this.gameData.gameConfigs.odds };

        Object.entries(settlementResult).forEach(([choice, win]) => {
            if (win) {
                finalOdds[choice] *= this.calculateCardMultipliers(appliedCardsPerChoice[choice]);
            }
        });

        return finalOdds;
    }

    calculateCardMultipliers(cards) {
        return cards.reduce((acc, curr) => acc * curr.value, 1);
    }

    settleAppliedCardsPerChoice(result, appliedMultipliers) {
        const filterCards = (cards) =>
            appliedMultipliers.filter((om) => cards.some((card) => card.rank === om.rank && card.suit === om.suit));

        const appliedPlayerCards = filterCards(Object.values(result.player));
        const appliedBankerCards = filterCards(Object.values(result.banker));

        return {
            player: appliedPlayerCards,
            banker: appliedBankerCards,
            tie: appliedMultipliers,
            playerPair: appliedPlayerCards,
            bankerPair: appliedBankerCards,
        };
    }

    async settleBets({ result, settlementResult, roundId, time, appliedMultipliers }) {
        const bets = await this.queryBets(roundId);
        const { gameConfigs } = this.gameData;

        if (bets && bets.length) {
            let odds = gameConfigs.odds;
            let appliedCardsPerChoice = {};

            if (gameConfigs.applyMultiplier) {
                appliedCardsPerChoice = this.settleAppliedCardsPerChoice(result, appliedMultipliers);
                odds = this.settleOdds(settlementResult, appliedCardsPerChoice);
            }

            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet, odds, appliedCardsPerChoice);

                    bet.betwin = betResult.totalWin;
                    bet.multipliers = betResult.multipliers;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    calculateBetResult(settlementResult, bet, odds, appliedCardsPerChoice) {
        const { gameConfigs } = this.gameData;

        const betResult = Object.entries(settlementResult).reduce(
            (result, [choice, win]) => {
                const betAmount = bet[choice] ?? 0;
                const originalOdds = odds[choice] || 1;
                const effectiveOdds = bet.freeBet ? originalOdds - 1 : originalOdds;
                const winAmount = win ? betAmount * effectiveOdds : 0;

                result.totalBetAmount += betAmount;
                result.totalWin += winAmount;
                result.winningByChoices[choice] = winAmount;

                if (winAmount > 0) {
                    result.netWin += winAmount - betAmount;
                    if (gameConfigs.applyMultiplier) {
                        result.multipliers[choice] = appliedCardsPerChoice[choice].map((x) => x.value);
                    }
                } else {
                    result.totalLost += betAmount;
                }

                return result;
            },
            {
                totalBetAmount: bet.fee,
                totalWin: 0,
                netWin: 0,
                totalLost: 0,
                winningByChoices: {},
                multipliers: {},
            }
        );

        if (settlementResult.tie) {
            betResult.totalWin += bet.player + bet.banker;
        }

        betResult.totalWin = +Math.min(betResult.totalWin, gameConfigs.maxWinPerRound).toFixed(2);
        betResult.netWin = +(betResult.netWin - bet.fee).toFixed(2);

        return betResult;
    }
}
