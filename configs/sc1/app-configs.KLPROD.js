export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l1-game-api-klprod-service:5000",
        authUrl: "http://l1-auth-api-klprod-service:5000",
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
        url: "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.146.34.26:39110,10.146.34.27:39110,10.146.34.30:39110,10.146.34.28:39110/?replicaSet=SabaMain&appName=baccaratx",
        options: {
            dbName: "minigame",
        },
    },
    sentry: {
        sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@sentry-scklprod-ovs.ops-klprod.gamora.prod/8",
        logIdentifier: "baccaratx",
        env: "PROD",
    },
    authenticateSettings: {
        url: "http://l1-auth-api-klprod-service:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://l1-user-service-klprod-service:5000",
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    enableMsgpackParser: true,
    metrics: {
        enable: true,
        secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
    },
    gameManagementApiSettings: {
        BASE: "http://l1-game-management-service-klprod-service:5000",
    },
    otel: {
        system: "SG",
        enabled: true,
        endpoint: "http://jaeger-collector-sc.ops-klprod.gamora.prod:32318/v1/traces",
    },
    gameResultSettings: {
        baseUrl: "http://l1-game-result-klprod-service:5000",
        id: "Game Service",
        key: "a9c83674-3d96-4b32-a431-142e3fd376fe",
    },
};
