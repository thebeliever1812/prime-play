import * as z from "zod";

export const UserSignupSchema = z.object({
    username: z
        .string()
        .lowercase()
        .trim()
        .min(8, { message: "Must be at least 8 characters" })
        .max(12, { message: "Must not exceed 12 characters" })
        .regex(/^[a-z0-9_]+$/, {
            message:
                "Username must be lowercase and contain only letters, numbers, or underscores (no spaces)",
        }),
    fullName: z
        .string()
        .trim()
        .min(2, { message: "Must be at least 2 characters" })
        .regex(/^^[A-Za-z]+([ '-][A-Za-z]+)*$/, {
            message:
                "Full name must start with a capital letter and can include multiple capitalized words (e.g., 'Basir Ahmad')",
        }),
    email: z.email(),
    password: z
        .string()
        .trim()
        .min(6, { message: "Must be at least 6 characters" })
        .max(10, { message: "Must not exceed 10 characters" }),
});
