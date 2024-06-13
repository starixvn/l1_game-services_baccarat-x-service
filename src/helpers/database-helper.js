import mongooseLong from "mongoose-long";
import { logger } from "sc-common";

export const configureDatabase = async (mongoose, { url = "", options = {} }) => {
    try {
        mongooseLong(mongoose);
        await mongoose.connect(url, options);
        console.log("Connect to MongoDB success " + url);

        mongoose.connection.once("open", function () {
            console.log("MongoDB database connection established successfully");
        });

        mongoose.connection.on("connected", () => {
            const message = `MongoDB connected at ${new Date()}`;
            logger.log(message);
        });

        mongoose.connection.on("reconnected", () => {
            const message = `MongoDB reconnected at ${new Date()}`;
            logger.logWarning(message);
        });

        mongoose.connection.on("disconnected", () => {
            logger.logWarning(`MongoDB disconnected at ${new Date()}`);
        });

        mongoose.connection.on("error", (err) => {
            logger.logError(err);
        });
    } catch (err) {
        logger.logError(err);
    }
};
