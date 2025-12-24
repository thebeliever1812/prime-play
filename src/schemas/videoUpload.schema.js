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
    thumbnail: z
        .any()
        .refine((file) => !!file, "Thumbnail is required")
        .refine(
            (file) => file.size <= 10 * 1024 * 1024,
            "Thumbnail must be less than 10 MB"
        )
        .refine(
            (file) => file.mimetype.startsWith("image/"),
            "Only image files are allowed for thumbnail"
        ),
    videoFile: z
        .any()
        .refine((file) => !!file, "Video file is required")
        .refine(
            (file) => file.mimetype.startsWith("video/"),
            "Only video files are allowed"
        )
        .refine(
            (file) => file.size <= 100 * 1024 * 1024,
            "Video file must be less than 100 MB"
        ),
});
