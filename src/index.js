import "@dotenvx/dotenvx/config";

import { connectMongoDb } from "./db/index.js";

const PORT = process.env.PORT;

await connectMongoDb();
