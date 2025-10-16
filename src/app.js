import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyJWT } from "./middlewares/auth.middleware.js";

const app = express();

// const isProduction = process.env.NODE_ENV === "production";

global.accessTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
};

global.refreshTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite:"none" ,
    path: "/",
    maxAge: 10 * 24 * 60 * 60 * 1000,
};

app.use(
    cors({
        origin: [process.env.FRONTEND_URL_LOCAL, process.env.FRONTEND_URL_PROD],
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(verifyJWT);

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import authRouter from "./routes/auth.routes.js";

// routes declaration
app.use("/api/v1/user", userRouter);

app.use("/api/v1/video", videoRouter);

app.use("/api/v1/auth", authRouter);

export default app;
