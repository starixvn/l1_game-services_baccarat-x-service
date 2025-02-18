export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l1_game_api_local_3:5000",
        authUrl: "http://l1_auth_api_local_3:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,

        placeBetTimeout: 2000,
        enabledApiLogs: true,
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:LmnBackend@10.10.50.12:39103,10.10.50.13:39103,10.10.50.14:39103/?replicaSet=L1pppLocal&appName=baccaratx",
        options: {
            dbName: "minigame",
        },
    },
    sentry: {
        sentryUrl: "https://50e405ebce7003a0e1edbda2bf28b14c@sentry-k8s.lumigame.com/3",
        logIdentifier: "baccaratx",
        env: "LOCAL",
    },
    authenticateSettings: {
        url: "http://l1_auth_api_local_3:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://l1_user_service_local_3:5000",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    enableMsgpackParser: false,
    enableMsgpackParser: false,
    gameManagementApiSettings: {
        BASE: "http://l1_game_management_service_local_3:5000",
    },
    otel: {
        system: "SG",
        enabled: true,
        endpoint: "http://10.10.50.69:4318/v1/traces",
    },
    gameResultSettings: {
        baseUrl: "http://l1_game_result_local_3:5000",
        id: "Game Service",
        key: "58148de3-b895-4f6b-82de-a35eed1b4b28",
    },
};
