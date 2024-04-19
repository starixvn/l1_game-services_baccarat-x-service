module.exports = async () => {
    return {
        rootDir: "./",
        verbose: true,
        transform: {
            "^.+\\.js?$": "babel-jest",
        },
        transformIgnorePatterns: [
            "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|sc-game-service-integration-utils|sc-multiple-games-base)/)",
        ],
        testEnvironment: "node",
        testResultsProcessor: "jest-junit",
        setupFilesAfterEnv: ["jest-extended"],
        globalSetup: "<rootDir>/tests/integration-tests/global-setup.cjs",
        globalTeardown: "<rootDir>/tests/integration-tests/global-teardown.cjs",
        testTimeout: 20000,
        testSequencer: "./test-sequencer.cjs",
        reporters: ["default", "jest-junit", ["jest-html-reporters", { publicPath: "./reports", filename: "report.html" }]],
    };
};
