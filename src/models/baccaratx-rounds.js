import mongoose from "mongoose";

const card = {
    rank: Number,
    suit: Number,
};

const hand = {
    card1: card,
    card2: card,
    card3: card,
    score: Number
};

const settlementResultSchema = new mongoose.Schema(
    {
        player: { type: Boolean, default: false },
        banker: { type: Boolean, default: false },
        tie: { type: Boolean, default: false },
        playerPair: { type: Boolean, default: false },
        bankerPair: { type: Boolean, default: false },
    },
    { _id: false }
);

const resultSchema = new mongoose.Schema(
    {
        player: { type: hand },
        banker: { type: hand },
    },
    { _id: false }
);

const Schema = new mongoose.Schema({
    id: { type: Number, required: true },
    settlementResult: settlementResultSchema,
    result: resultSchema,
    oddsMultipliers: { type: Array },
    appliedMultipliers: { type: Object },
    time: { type: Date, default: new Date() },
    exchangeRateId: { type: Number, required: true },
    extraFeeRatio: { type: Number, required: false },
    usedCardIndexes: { type: [Number] },
});

export default (modelName) => {
    return mongoose.model(modelName, Schema);
};
