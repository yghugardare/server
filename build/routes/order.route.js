"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const order_controller_1 = require("../controller/order.controller");
exports.orderRouter = express_1.default.Router();
exports.orderRouter.post("/create-order", auth_1.isAuthenticated, order_controller_1.createOrder);
exports.orderRouter.get("/get-orders", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), order_controller_1.getAllOrders);
exports.orderRouter.get("/payment/stripepublishablekey", order_controller_1.sendStripePublishableKey);
exports.orderRouter.post("/payment", auth_1.isAuthenticated, order_controller_1.newPayment);
