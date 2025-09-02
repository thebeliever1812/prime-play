import { connect } from "mongoose";

export const connectMongoDb = async () => {
    const MongoDbConnectionUrl = process.env.MONGODB_URI;
    try {
        await connect(MongoDbConnectionUrl)
        console.log('MongoDB connected')
    } catch (error) {
        console.log("Error connecting MongoDb:", error)
        process.exit(1)
    }
};
