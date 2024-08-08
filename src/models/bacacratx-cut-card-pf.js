import mongoose from "mongoose";

const PlayerCutCardSchema = {
    name: { type: String, required: true },
    clientSeed: { type: Number, required: true },
    time: { type: Date, required: true },
};

const Schema = {
    roundId: { type: Number, required: true },
    time: { type: Date },
    serverCutCardIndex: { type: Number, required: true },
    playerCutCards: { type: [PlayerCutCardSchema] },
};

export default (modelName) => {
    return mongoose.model(modelName, Schema);
};
