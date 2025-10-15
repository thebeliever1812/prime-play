import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const handleGetAuthenticationDetails = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, Please login");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Authenticated user", req.user));
};
