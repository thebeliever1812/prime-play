import z from "zod";
import { passwordValidation } from "./userRegister.schema.js";

export const UserPasswordSchema = z.object({
    password: passwordValidation,
});
