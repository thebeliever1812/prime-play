import { connect } from "mongoose";

export const connectMongoDb = async () => {
    const mongoDbConnectionUrl = process.env.MONGODB_URI;
    try {
        await connect(mongoDbConnectionUrl)
        console.log('MongoDB connected')
    } catch (error) {
        console.log("Error connecting MongoDb:", error)
        throw error
    }
};
