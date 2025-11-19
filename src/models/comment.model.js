import { Schema, model } from "mongoose";

export const CommentSchema = new Schema(
    {
        content: {
            type: String,
            trim: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Comment = model("Comment", CommentSchema);
