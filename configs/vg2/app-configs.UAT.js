export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l2-game-api-uat-service:5000",
        authUrl: "http://l2-auth-api-uat-service:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 2000,
        requestTimeout: 10000, // 10s

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
        url: "mongodb://lmn_backend:LmnBackend%4022027@10.146.34.28:39220/?replicaSet=SabaL2UAT&appName=baccaratx",
        options: {
            dbName: "minigame",
        },
    },
    sentry: {
        sentryUrl: "http://8ac47fca6d3e4a41908896a64ef201ac@10.2.190.51:9009/53",
        logIdentifier: "baccaratx",
        env: "UAT",
    },
    authenticateSettings: {
        url: "http://l2-auth-api-uat-service:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://l2-user-service-uat-service:5000",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    enableMsgpackParser: true,
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    gameManagementApiSettings: {
        BASE: "http://l2-game-management-service-uat-service:5000",
    },
    otel: {
        system: "VG2",
        enabled: true,
        endpoint: "http://10.2.190.51:4318/v1/traces",
    },
    gameResultSettings: {
        baseUrl: "http://l2-game-result-uat-service:5000",
        id: "Game Service",
        key: "bb8d0de2-b07b-428a-94f7-40e9e34ac23c",
    },
};
