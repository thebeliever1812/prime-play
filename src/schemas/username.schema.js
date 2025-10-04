import z from "zod";
import { usernameValidation } from "./userRegister.schema.js";

export const UsernameSchema = z.object({
    username: usernameValidation,
});
