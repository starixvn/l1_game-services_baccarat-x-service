import BaccaratXBot from "./baccaratx-bot";
import BaccaratXGameCron from "./baccaratx-game-cron";
import ProcessBetQueue from "./process-bet-queue";

export { BaccaratXBot, BaccaratXGameCron, ProcessBetQueue };
const s = {
    oddsMultipliers: [
        {
            rank: 4,
            suit: 1,
            value: 4,
        },
        {
            rank: 2,
            suit: 3,
            value: 3,
        },
        {
            rank: 5,
            suit: 0,
            value: 2,
        },
    ],
    appliedMultipliers: {
        player: [
            {
                rank: 4,
                suit: 1,
                value: 4,
            },
        ],
        banker: [],
    },
    time: {
        $date: "2024-05-24T02:39:00.112Z",
    },
    id: 20,
    result: {
        player: {
            card1: {
                rank: 10,
                suit: 0,
            },
            card2: {
                rank: 4,
                suit: 1,
            },
            card3: {
                rank: 11,
                suit: 2,
            },
        },
        banker: {
            card1: {
                rank: 5,
                suit: 0,
            },
            card2: {
                rank: 4,
                suit: 1,
            },
            card3: {
                rank: 2,
                suit: 3,
            },
        },
    },
    settlementResult: {
        player: true,
        banker: false,
        tie: false,
        playerPair: false,
        bankerPair: false,
    },
};
