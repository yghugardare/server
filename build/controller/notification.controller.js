"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotifications = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const node_cron_1 = __importDefault(require("node-cron"));
exports.getNotifications = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get the notfication based on the newest one at the top
        const notifications = await notification_model_1.default.find().sort({
            createdAt: -1,
        });
        // send a response
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// update the notification status to "read"
// only for admin
exports.updateNotification = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // find the notification that you read
        const notification = await notification_model_1.default.findById(req.params.id);
        // handle case
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 404));
        }
        else {
            notification.status
                ? (notification.status = "read")
                : notification.status;
        }
        // save to db
        await notification.save();
        // after saving again sort, so at frontend updating state becomes easy
        const notifications = await notification_model_1.default.find().sort({
            createdAt: -1,
        });
        // send response
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//  run the task every day at midnight
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // delete notifications more than 30 days
    await notification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("Deleted read notifications");
});
