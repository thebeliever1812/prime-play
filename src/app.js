import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyJWT } from "./middlewares/auth.middleware.js";

const app = express();

global.cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'))
app.use(cookieParser())
app.use(verifyJWT)

// routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"

// routes declaration
app.use('/api/v1/user', userRouter)

app.use("/api/v1/video", videoRouter);

export default app;
