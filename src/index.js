import "@dotenvx/dotenvx/config";

import app from "./app.js";
import { connectMongoDb } from "./db/index.js";

const PORT = process.env.PORT || 8000;

try {
    await connectMongoDb();

    app.on("error", (error) => {
        console.error("Server error:", error);
        process.exit(1);
    });

    app.listen(PORT, () =>
        console.log(`Server started at http://localhost:${PORT}`)
    );
} catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
}