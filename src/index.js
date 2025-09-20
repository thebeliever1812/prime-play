import "@dotenvx/dotenvx/config";

import app from "./app.js";
import { connectMongoDb } from "./db/index.js";

const PORT = process.env.PORT || 3000;

try {
    await connectMongoDb();

    app.on("error", (error) => {
        console.log("Error in app:", error);
        throw error;
    });

    app.listen(PORT, () =>
        console.log(`Server started at http://localhost:${PORT}`)
    );
} catch (error) {
    console.log("MongoDB connection Failed", error);
}
