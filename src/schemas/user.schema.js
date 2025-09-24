import * as z from "zod";

export const UserSchema = z.object({
    username: z
        .string()
        .lowercase()
        .trim()
        .length(10, { message: "Length must be exactly 10 characters" })
        .regex(/^[a-z0-9_]+$/, {
            message:
                "Username must be lowercase and contain only letters, numbers, or underscores (no spaces)",
        }),
    fullName: z
        .string()
        .trim()
        .minLength(2, { message: "Must be at least 2 characters" })
        .regex(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/, {
            message:
                "Full name must start with a capital letter and can include multiple capitalized words (e.g., 'Basir Ahmad')",
        }),
    email: z.email(),
    password: z
        .string()
        .trim()
        .minLength(6, { message: "Must be at least 6 characters" })
        .maxLength(10, { message: "Must not exceed 10 characters" }),
});
