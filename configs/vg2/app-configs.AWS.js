export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l2_game_api_AWS:5000",
        authUrl: "http://l2_auth_api_AWS:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4000,
        requestTimeout: 10000,
        hitJackpotTimeout: 200000,
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
        url: "mongodb://lmn_backend:Sb%7B5r%40Xy4X%256%28%24%5Bt%252HsOxJ%7CQt9jdR%26t@10.99.99.56:27101/?replicaSet=l2_SabaAWS",
        options: {
            dbName: "minigame",
        },
    },
    sentry: {
        sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@10.99.99.187:803/8",
        logIdentifier: "night-club",
        env: "AWS",
    },
    authenticateSettings: {
        url: "http://l2_auth_api_AWS:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://localhost:8004/api",
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    freeSpinLiveSeconds: 86400, // 1 day
    bonusLiveSeconds: 123,
};
