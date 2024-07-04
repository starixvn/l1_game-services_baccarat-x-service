import { tracer } from "sc-instrument";
import { Consumers } from "sc-card-game-base";

export default class SettleGameRoundConsumer extends Consumers.SettleGameRoundConsumer {
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
        const span = tracer.startSpan("generateResult");

        const { result, usedCardsCount } = this.definition.generateResult(this.gameData.shoe);
        const usedCardIndexes = Array.from({ length: usedCardsCount }, (_, i) => this.gameData.shoe.currentIndex + i);
        this.gameData.shoe.currentIndex = this.gameData.shoe.currentIndex + usedCardsCount;
        this.gameData.shoe.remainingCards = this.definition.maxCardsPerRound - usedCardsCount;

        await this.resultsRepository.updateOne(
            { isAvailable: true },
            {
                $set: {
                    currentIndex: this.gameData.shoe.currentIndex,
                    remainingCards: this.gameData.shoe.remainingCards,
                },
            }
        );

        span.end();

        return { result, usedCardIndexes };
    }

    async settleRound() {
        const span = tracer.startSpan("settleRound");

        const { result, usedCardIndexes } = await this.generateResult(this.gameData.shoe);
        const settlementResult = this.definition.settle(result);
        const { roundId, exchangeRates, gameConfigs } = this.gameData;

        let finalOdds = gameConfigs.odds;
        let appliedCardsPerChoice, oddsMultipliers, appliedMultipliers;

        if (gameConfigs.applyMultiplier) {
            oddsMultipliers = this.gameData.oddsMultipliers ?? (await this.multiplierCardsConsumer.generate());
            appliedMultipliers = this.settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult);

            appliedCardsPerChoice = this.settleAppliedCardsPerChoice(result, appliedMultipliers);
            finalOdds = this.settleOdds(settlementResult, appliedCardsPerChoice);
        }

        this.roundsRepository
            .create({
                id: roundId,
                result,
                settlementResult,
                time: new Date(),
                exchangeRateId: exchangeRates.exId,
                oddsMultipliers,
                appliedMultipliers,
                usedCardIndexes,
                extraFeeRatio: this.gameData.gameConfigs.oddsMultipliers?.extraFeeRatio,
            })
            .then(async (newRound) => {
                if (newRound) {
                    console.log(newRound);
                    this.roundResultPublisher.publishRoundResult({
                        ...this.collectRoundResult(result, settlementResult, roundId),
                        oddsMultipliers,
                        appliedMultipliers,
                        finalOdds,
                    });

                    const finish = {
                        settlementResult,
                        result,
                        roundId: newRound.id,
                        time: newRound.time,
                        oddsMultipliers,
                        appliedMultipliers,
                        finalOdds,
                        appliedCardsPerChoice,
                    };

                    this.gameData.roundId = finish.roundId + 1;

                    await this.settleBets(finish);
                    this.roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers);
                }
            });

        span.end();
    }

    settleAppliedMultiplierCards(oddsMultipliers, result, settlementResult) {
        const appliedMultiplierCards = {
            player: [],
            banker: [],
        };
        const playerCards = result.player.getCards();
        const bankerCards = result.banker.getCards();

        const filterMultiplierCards = (cards) => {
            const result = [];
            for (const card of cards) {
                const multiplierCard = oddsMultipliers.find((om) => card.rank === om.rank && card.suit === om.suit);
                multiplierCard && result.push(multiplierCard);
            }

            return result;
        };

        if (settlementResult.tie) {
            appliedMultiplierCards.player.push(...filterMultiplierCards(playerCards));
            appliedMultiplierCards.banker.push(...filterMultiplierCards(bankerCards));
        } else {
            if (settlementResult.player) {
                appliedMultiplierCards.player.push(...filterMultiplierCards(playerCards));
            }

            if (settlementResult.banker) {
                appliedMultiplierCards.banker.push(...filterMultiplierCards(bankerCards));
            }
        }

        if (settlementResult.playerPair && appliedMultiplierCards.player.length === 0) {
            appliedMultiplierCards.player.push(...filterMultiplierCards(playerCards.slice(0, 2)));
        }

        if (settlementResult.bankerPair && appliedMultiplierCards.banker.length === 0) {
            appliedMultiplierCards.banker.push(...filterMultiplierCards(bankerCards.slice(0, 2)));
        }

        return appliedMultiplierCards;
    }

    settleOdds(settlementResult, appliedCardsPerChoice) {
        const finalOdds = { ...this.gameData.gameConfigs.odds };

        for (const choice of this.definition.choices) {
            if (settlementResult[choice]) {
                finalOdds[choice] = (finalOdds[choice] - 1) * this.calculateCardMultipliers(appliedCardsPerChoice[choice]) + 1;
            }
        }

        return finalOdds;
    }

    calculateCardMultipliers(cards) {
        return cards.reduce((acc, curr) => acc * curr.value, 1);
    }

    settleAppliedCardsPerChoice(result, appliedMultipliers) {
        const { player, banker } = result;

        const playerPairCards = appliedMultipliers.player.filter(
            (playerCard) => player.card3 && (playerCard.rank !== player.card3.rank || playerCard.suit !== player.card3.suit)
        );

        const bankerPairCards = appliedMultipliers.banker.filter(
            (bankerCard) => banker.card3 && (bankerCard.rank !== banker.card3.rank || bankerCard.suit !== banker.card3.suit)
        );

        return {
            player: appliedMultipliers.player,
            banker: appliedMultipliers.banker,
            tie: [...appliedMultipliers.player, ...appliedMultipliers.banker],
            playerPair: playerPairCards,
            bankerPair: bankerPairCards,
        };
    }

    async settleBets({ settlementResult, roundId, time, appliedCardsPerChoice, finalOdds }) {
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet, finalOdds, appliedCardsPerChoice);

                    bet.betwin = betResult.totalWin;
                    bet.multipliers = betResult.multipliers;
                    bet.paid = true;
                    bet.reachMaxWin = betResult.totalWin === bet.maxWin;

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
                multipliers: gameConfigs.applyMultiplier ? {} : undefined,
            }
        );

        if (settlementResult.tie) {
            betResult.totalWin += bet.player + bet.banker;
        }

        betResult.totalWin = +Math.min(betResult.totalWin, bet.maxWin).toFixed(2);
        betResult.netWin = +(betResult.netWin - bet.fee).toFixed(2);

        return betResult;
    }
}
