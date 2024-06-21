import mongoose from "mongoose";

const bet = {
    playerId: { type: String, required: true },
    operatorId: { type: String, required: true },
    bet: { type: Object, required: true },
};

export default function allGamesHistories(modelName) {
    return mongoose.model(modelName, new mongoose.Schema(bet));
}
