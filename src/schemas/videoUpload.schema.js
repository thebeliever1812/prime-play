import { z } from "zod";

export const VideoUploadSchema = z.object({
    title: z
        .string({
            required_error: "Title is required",
        })
        .trim()
        .min(1, "Title cannot be empty")
        .max(100, { message: "Title cannot exceed 100 characters" }),
    description: z
        .string({
            required_error: "Description is required",
        })
        .trim()
        .min(1, "Description cannot be empty")
        .max(5000, "Description cannot exceed 5000 characters"),
});
