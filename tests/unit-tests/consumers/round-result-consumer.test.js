import RoundResultConsumer from "../../../src/consumers/round-result-consumer";

describe("roundResultConsumer", () => {
    let consumer;
    const gameData = {},
        definition = {},
        roundResultPublisher = {},
        resultsRepository = {},
        logService = {},
        cutCardConsumer = {},
        shoeConsumer = {};

    beforeEach(() => {
        consumer = new RoundResultConsumer(
            gameData,
            definition,
            roundResultPublisher,
            resultsRepository,
            logService,
            cutCardConsumer,
            shoeConsumer
        );
    });
});
