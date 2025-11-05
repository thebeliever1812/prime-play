import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const handleSubscribeChannel = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized user please login to subscribe");
    }

    const { channelId, subscribe: subscribeStatus } = req.body;

    // Logic to subscribe or unsubscribe the user from the channel
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    if (typeof subscribeStatus === "undefined") {
        throw new ApiError(400, "Subscribe status is required");
    }

    const subscriberId = req.user._id;

    if (!subscriberId) {
        throw new ApiError(401, "Unauthorized user please login to subscribe");
    }

    if (subscribeStatus) {
        // Subscribe logic
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId,
        });
        if (existingSubscription) {
            throw new ApiError(400, "Already subscribed to this channel");
        }
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        return res
            .status(201)
            .json(
                new ApiResponse(201, "Subscribed successfully", newSubscription)
            );
    } else {
        // Unsubscribe logic
        const deletedSubscription = await Subscription.findOneAndDelete({
            subscriber: subscriberId,
            channel: channelId,
        });
        if (!deletedSubscription) {
            throw new ApiError(400, "Not subscribed to this channel");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Unsubscribed successfully",
                    deletedSubscription
                )
            );
    }
};
