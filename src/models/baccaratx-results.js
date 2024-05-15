import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    isAvailable: { type: Boolean, required: true },
    currentIndex: { type: Number, required: true },
    cutCardIndex: { type: Number, required: true },
    burnedCards: { type: Number, required: true },
    remainingCards: { type: Number, required: true },
    shoe: { type: Object, required: true },
    firstRoundId: { type: Number, required: true },
    time: { type: Date, default: Date.now },
});

export default (modelName) => {
    return mongoose.model(modelName, resultSchema);
};
