"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
require("dotenv").config();
const redis_1 = require("./redis");
// parse enviroment variables to integrates with fallback values
// parse enviroment variables to integrates with fallback values
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);
// options for cookies
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};
// cread send token function
const sendToken = (user, statusCode, res) => {
    // get access and refresh token
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    // upload session to redis
    // JWTs are stateless, meaning the server doesn't store any session information.
    //By uploading the session (user information or token details) to Redis, the server can efficiently manage the state of tokens and quickly determine if a token is valid or has been revoked.
    redis_1.redis.set(user._id, JSON.stringify(user));
    // set secure true only when in production
    // if (process.env.NODE_ENV === "production") {
    //   accessTokenOptions.secure = true;
    //   refreshTokenOptions.secure = true;
    // }
    // send tokens to cookies
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    // send response to client
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
exports.sendToken = sendToken;
