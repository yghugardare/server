require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import { courseRouter } from "./routes/course.route";
import { orderRouter } from "./routes/order.route";
import { notificationRouter } from "./routes/notification.route";
import { analyticsRouter } from "./routes/analytics.route";
import { layoutRouter } from "./routes/layout.route";
// import userRouter

// create a server
export const app = express();
// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parse
app.use(cookieParser());
// origin: process.env.ORIGIN,
// cors =>
app.use(
  cors({
    
    origin:["https://elearning-ui-frontend.vercel.app"],
    credentials:true
  })
);
app.use((req:Request, res:Response, next:NextFunction) => {
  res.header("Access-Control-Allow-Origin", "https://elearning-ui-frontend.vercel.app");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
// routes
app.use(
  "/api/v1",
  userRouter,
  courseRouter,
  orderRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter
);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});
// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(ErrorMiddleware);
