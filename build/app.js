"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./middleware/error");
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = require("./routes/course.route");
const order_route_1 = require("./routes/order.route");
const notification_route_1 = require("./routes/notification.route");
const analytics_route_1 = require("./routes/analytics.route");
const layout_route_1 = require("./routes/layout.route");
// import userRouter
// create a server
exports.app = (0, express_1.default)();
// body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
// cookie parse
exports.app.use((0, cookie_parser_1.default)());
// cors =>
exports.app.use((0, cors_1.default)({
    // origin: process.env.ORIGIN,
    origin: ["https://elearning-front-end.vercel.app"],
    credentials: true
}));
exports.app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://elearning-front-end.vercel.app");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});
// routes
exports.app.use("/api/v1", user_route_1.default, course_route_1.courseRouter, order_route_1.orderRouter, notification_route_1.notificationRouter, analytics_route_1.analyticsRouter, layout_route_1.layoutRouter);
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});
// unknown route
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// middleware calls
exports.app.use(error_1.ErrorMiddleware);
