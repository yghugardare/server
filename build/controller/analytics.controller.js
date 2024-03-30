"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoursesAnalytics = exports.getOrderAnalytics = exports.getUsersAnalytics = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const analytics_generator_1 = require("../utils/analytics.generator");
const user_model_1 = __importDefault(require("../models/user.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
// ONLY FOR ADMIN
// get users analytics or number of users
// for admin to analyse his sales
exports.getUsersAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get users data for last 12 months by
        // providing the user model
        const users = await (0, analytics_generator_1.generateLast12MothsData)(user_model_1.default);
        //send the res
        res.status(201).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// similarly get orders
exports.getOrderAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const orders = await (0, analytics_generator_1.generateLast12MothsData)(order_model_1.default);
        res.status(200).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get courses analytics as well
exports.getCoursesAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courses = await (0, analytics_generator_1.generateLast12MothsData)(course_model_1.default);
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
