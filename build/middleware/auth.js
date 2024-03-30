"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
const user_controller_1 = require("../controller/user.controller");
// function to check if user is authenticated
exports.isAuthenticated = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    // we will extract encrypted access token from our cookies
    const access_token = req.cookies.access_token;
    // handle case where the extracted token is not there
    // in that case user is not logged in
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    // get the decoded token
    const decoded = jsonwebtoken_1.default.decode(access_token);
    if (!decoded) {
        return next(new ErrorHandler_1.default("access token is not valid", 400));
    }
    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
            await (0, user_controller_1.updateAccessToken)(req, res, next);
        }
        catch (error) {
            return next(error);
        }
    }
    else {
        // get user from redis through is id
        const user = await redis_1.redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler_1.default("Please login [decoded] to access this resource", 400));
        }
        // add user in req
        req.user = JSON.parse(user);
        next();
    }
});
// middleware to validate user role
// so that a user with specific role can get access to the
// route
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler_1.default(`Role: ${req.user?.role} is not allowed to access this resource`, 404));
        }
        // else validate and go further
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
