"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analytics_controller_1 = require("../controller/analytics.controller");
const analyticsRouter = express_1.default.Router();
exports.analyticsRouter = analyticsRouter;
analyticsRouter.get("/get-users-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getUsersAnalytics);
analyticsRouter.get("/get-orders-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getOrderAnalytics);
analyticsRouter.get("/get-courses-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getCoursesAnalytics);
