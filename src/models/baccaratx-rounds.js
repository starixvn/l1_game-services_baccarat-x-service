import mongoose from "mongoose";

const settlementResultSchema = new mongoose.Schema(
    {
        big: { type: Boolean, default: false },
        small: { type: Boolean, default: false },
    },
    { _id: false }
);

const resultSchema = new mongoose.Schema(
    {
        dice1: { type: Number, required: true },
        dice2: { type: Number, required: true },
        dice3: { type: Number, required: true },
    },
    { _id: false }
);

const Schema = new mongoose.Schema({
    id: { type: Number, required: true },
    settlementResult: settlementResultSchema,
    result: resultSchema,
    time: { type: Date, default: new Date() },
    exchangeRateId: { type: Number, required: true },
});

export default (modelName) => {
    return mongoose.model(modelName, Schema);
};
