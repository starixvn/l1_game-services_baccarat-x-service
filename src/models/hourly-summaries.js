import mongoose from "mongoose";

const schema = new mongoose.Schema({
    time: { type: Date, required: true },
    currency: { type: String, required: true },
    gameId: { type: Number, required: true },
    operatorId: { type: String, required: true },
    stake: { type: Number, alias: "USD.stake" },
    payout: { type: Number, alias: "USD.payout" },
});

export default mongoose.connection.useDb("summary").model("hourly_summaries", schema);
