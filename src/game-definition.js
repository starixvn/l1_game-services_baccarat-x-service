import { GameDefinition } from "sc-card-game-base";

export default class GameDefinition extends GameDefinition {
    constructor(
        {
            id = 0,
            name = "",
            durations = {},
            choices = [],
            choicesMapper = {},
            hedgeBetGroups = [],
            numberOfRoundHistory = 100,
            historyPageSize = 8,
            numberOfDecks = 1,
            maxCardsPerRound = 2,
            minCutCardIndex = 20,
            maxCutCardIndex = 22,
            commonChoices = [],
        },
        generateResult,
        settle
    ) {
        super(
            { id, name, durations, choices, choicesMapper, hedgeBetGroups, numberOfRoundHistory, historyPageSize },
            generateResult,
            settle
        );
        this.numberOfDecks = numberOfDecks;
        this.maxCardsPerRound = maxCardsPerRound;
        this.minCutCardIndex = minCutCardIndex;
        this.maxCutCardIndex = maxCutCardIndex;
        this.commonChoices = commonChoices;
    }
}
