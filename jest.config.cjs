module.exports = async () => {
    return {
        rootDir: "./",
        verbose: true,
        transform: {
            "^.+\\.js?$": "babel-jest",
        },
        transformIgnorePatterns: [
            "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|jest-auto-fixture|sc-game-service-integration-utils|sc-game-management-client|sc-card-game-base|sc-multiple-games-base|crypto-random-string|axios|nanoid)/)",
        ],
        testEnvironment: "node",
        testResultsProcessor: "jest-sonar-reporter",
        setupFilesAfterEnv: ["jest-extended/all"],
        reporters: ["default", ["jest-html-reporters", { publicPath: "./reports", filename: "report.html" }]],
    };
};
