import mongoose from "mongoose";

const bet = {
    uid: { type: String, required: true },
    name: { type: String, required: true },

    player: { type: Number, default: 0 },
    banker: { type: Number, default: 0 },
    tie: { type: Number, default: 0 },
    playerPair: { type: Number, default: 0 },
    bankerPair: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    multiplieres: { type: Object },

    betwin: { type: Number, default: 0 },
    time: { type: Date },
    odds: { type: Object },

    siteId: { type: String },
    freeBet: { type: Boolean, default: false },

    currency: { type: String, required: true },
    rate: { type: Number, required: true },

    playerId: { type: String, required: true },
    operatorId: { type: String, required: true },
    roundId: { type: Number, default: 0, required: true },
    paid: { type: Boolean, default: false },
};

const betLog = {
    uid: { type: String, required: true },
    name: { type: String, required: true },

    choice: { type: String, required: true },
    amount: { type: Number, default: 0, required: true },
    fee: { type: Number, default: 0 },

    time: { type: Date },

    siteId: { type: String },
    freeBet: { type: Boolean, default: false },

    playerId: { type: String, required: true },
    operatorId: { type: String, required: true },
    roundId: { type: Number, default: 0, required: true },

    currency: { type: String, required: true },
    rate: { type: Number, required: true },

    clientSentTime: { type: Date },
    receivedTime: { type: Date },
};

export function getBetModel(modelName) {
    return mongoose.model(modelName, new mongoose.Schema(bet));
}

export function getBetLogModel(modelName) {
    return mongoose.model(modelName, new mongoose.Schema(betLog));
}
