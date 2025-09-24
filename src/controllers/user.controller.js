import { ApiError } from "../utils/ApiError";

export const handleRegisterUser = async (req, res) => {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    
    try {
    } catch (error) {
        console.log("Error in registration:", error);
    }
};
