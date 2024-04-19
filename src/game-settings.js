import { generateRawResultForHash, generateResult, getSettlementResult as settle } from "./helpers/result-helper";
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
            wholeRound: 60,
            placingBets: 50,
            lockingBet: 5,
            shakeThePlateDuration: 2,
        },
        choices,
        hedgeBetGroups,
        choicesMapper,
        generateResult,
        settle,
        generateRawResultForHash,
        repositories: {
            roundsRepository: getRoundModel("baccaratx_round"),
            betsRepository: getBetModel("baccaratx_bet"),
            betLogsRepository: getBetLogModel("baccaratx_betlog"),
            resultsRepository: getResultModel("baccaratx_result"),
            allGamesBetsRepository,
        },
        numberOfRoundHistory: 100,
    },
];
