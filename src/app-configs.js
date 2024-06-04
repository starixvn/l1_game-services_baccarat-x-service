export default {
    hostingPort: 5002,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://api.lumigame.com",
        authUrl: "http://auth.lumigame.com",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4000,
        hitJackpotTimeout: 200000,
        enableApiLogs: true,
    },
    mainServerApiSettings: {
        url: "http://localhost:8080/api",
        auth: {
            url: "http://auth.lumigame.com",
            id: "game-services",
            secret: "gameservices@20luminet&",
        },
        requestTimeout: 10000,
        useAuthenticate: true,
    },
    gameManagementApiSettings: {
        BASE: "https://l1-proxy.lumigame.com/game-management-service",
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:LmnBackend@10.10.50.12:39100,10.10.50.13:39100,10.10.50.14:39100/?replicaSet=L1Local&appName=baccaratx",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "https://8f52d1ed1dbc4500adddbfb6e20f66aa@sentryuat.sabagame.com/217",
        logIdentifier: "baccaratx",
        env: "LOCAL",
    },
    authenticateSettings: {
        url: "https://auth.lumigame.com",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: false,
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    userServiceSettings: {
        url: "http://127.0.0.1:5000",
    },
};
