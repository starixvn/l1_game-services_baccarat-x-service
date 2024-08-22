import { generateResult, getSettlementResult as settle } from "./helpers/result-helper";
import {
    allGamesHistories,
    getBetLogModel,
    getBetModel,
    getCutCardPfModel,
    getMultipliersModel,
    getResultModel,
    getRoundModel,
    getTmpBetModel,
} from "./models";

const choicesMapper = { player: 1, banker: 2, tie: 3, playerPair: 4, bankerPair: 5 };
const choices = ["player", "banker", "tie", "playerPair", "bankerPair"];
const hedgeBetGroups = [["player", "banker"]];
const commonChoices = ["player", "banker", "tie"];

const allGamesBetsRepository = allGamesHistories("megabigsmall_histories");

export default [
    {
        id: 81,
        name: "bac81",
        configName: "bac81",
        durations: {
            wholeRound: 47,
            placingBets: 30,
            lockingBet: 3,
            dealCards: 4,
            changingDeck: 18,
            lockingCutCard: 1,
            generatingShoe: 52,
            generatingCutCardIndex: 42,
        },
        choices,
        commonChoices,
        hedgeBetGroups,
        choicesMapper,
        generateResult,
        settle,
        repositories: {
            roundsRepository: getRoundModel("bac81_round"),
            betsRepository: getBetModel("bac81_bet"),
            tempBetsRepository: getTmpBetModel("bac81_tmpBets"),
            betLogsRepository: getBetLogModel("bac81_betlog"),
            resultsRepository: getResultModel("bac81_result"),
            cutCardPFRepository: getCutCardPfModel("bac81_cut_card_pf"),
            multipliersRepository: getMultipliersModel("bac81_multipliers"),
            allGamesBetsRepository,
        },
        numberOfRoundHistory: 100,
        numberOfDecks: 8,
        maxCardsPerRound: 6,
        minCutCardIndex: 250,
        maxCutCardIndex: 306,
        defaultRTPPercentage: 98
    },
];
