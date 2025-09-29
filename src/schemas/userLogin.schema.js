import * as z from "zod";
import { emailValidation, passwordValidation } from "./userRegister.schema.js";

export const UserLoginSchema = z.object({
    email: emailValidation,
    password: passwordValidation,
});
