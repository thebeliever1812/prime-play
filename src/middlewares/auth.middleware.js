import jwt from "jsonwebtoken";

export const verifyJWT =(req, _res, next) => {
    const accessToken =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
        req.user = null;
        return next();
    }

    try {
        const isVerifiedAccessToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        req.user = {
            _id: isVerifiedAccessToken?._id,
            username: isVerifiedAccessToken?.username,
            fullName: isVerifiedAccessToken?.fullName,
            email: isVerifiedAccessToken?.email,
            avatar: isVerifiedAccessToken?.avatar,
            coverImage: isVerifiedAccessToken?.coverImage
        };

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};
