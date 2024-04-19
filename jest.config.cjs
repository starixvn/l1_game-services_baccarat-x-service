module.exports = async () => {
    return {
        rootDir: "./",
        verbose: true,
        transform: {
            "^.+\\.js?$": "babel-jest",
        },
        transformIgnorePatterns: [
            "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-multiple-games-base||sc-base-apis|sc-api-client|sc-game-service-integration-utils)/)",
        ],
        testEnvironment: "node",
        testResultsProcessor: "jest-sonar-reporter",
        setupFilesAfterEnv: ["jest-extended"],
        reporters: ["default", ["jest-html-reporters", { publicPath: "./reports", filename: "report.html" }]],
    };
};
