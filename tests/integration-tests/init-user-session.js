import { currencyData } from "./stubs/test-data";

export const initUserSession = (user) => {
    return {
        session: `${user.playerId}-session-id`,
        ss: `${user.playerId}-session-id`,
        currency: currencyData.name,
        username: `${user.playerId}_${user.playerName}`,
        browserUserAgent: "browser-user-agent",
    };
};
