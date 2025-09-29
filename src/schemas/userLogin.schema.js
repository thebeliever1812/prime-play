import * as z from "zod";
import { emailValidation, passwordValidation } from "./userRegister.schema";

export const UserLoginSchema = z.object({
    email: emailValidation,
    password: passwordValidation,
});
