import { GameDefinition } from "sc-multiple-games-base";

export default class BaccaratGameDefinition extends GameDefinition {
    constructor({
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
        repositories,
        generateResult,
        settle,
    }) {
        super({
            id,
            name,
            durations,
            choices,
            choicesMapper,
            hedgeBetGroups,
            numberOfRoundHistory,
            historyPageSize,
            repositories,
            generateResult,
            settle,
        });
        this.numberOfDecks = numberOfDecks;
        this.maxCardsPerRound = maxCardsPerRound;
        this.minCutCardIndex = minCutCardIndex;
        this.maxCutCardIndex = maxCutCardIndex;
        this.commonChoices = commonChoices;
    }
}
