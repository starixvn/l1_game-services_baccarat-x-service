import mongoose from "mongoose";

const schema = new mongoose.Schema({
    cards: { type: Array, required: true },
    roundId: { type: Number, required: true },
});

export default (modelName) => {
    return mongoose.model(modelName, schema);
};
