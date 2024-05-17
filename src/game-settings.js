import { generateResult, getSettlementResult as settle } from "./helpers/result-helper";
import { allGamesHistoriesModel, getBetLogModel, getBetModel, getResultModel, getRoundModel } from "./models";

const choicesMapper = { player: 1, banker: 2, tie: 3, playerPair: 4, bankerPair: 5 };
const choices = ["player", "banker", "tie", "playerPair", "bankerPair"];
const hedgeBetGroups = [["player", "banker"]];

const allGamesBetsRepository = allGamesHistoriesModel("megabigsmall_histories");

export default [
    {
        id: 50,
        name: "BaccaratX",
        configName: "baccaratx",
        durations: {
            wholeRound: 48,
            placingBets: 30,
            lockingBet: 3,
            dealCards: 5,
            changingDeck: 20,
            cutCard: 3,
            generatingShoe: 40,
            generatingCutCardIndex: 50,
        },
        choices,
        hedgeBetGroups,
        choicesMapper,
        generateResult,
        settle,
        repositories: {
            roundsRepository: getRoundModel("baccaratx_round"),
            betsRepository: getBetModel("baccaratx_bet"),
            betLogsRepository: getBetLogModel("baccaratx_betlog"),
            resultsRepository: getResultModel("baccaratx_result"),
            cutCardPFRepository: getResultModel("baccaratx_cut_card_pf"),
            allGamesBetsRepository,
        },
        numberOfRoundHistory: 100,
        numberOfDecks: 8,
        maxCardsPerRound: 6,
        minCutCardIndex: 123,
        maxCutCardIndex: 144,
    },
];
