"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
// function for resgitering the user
exports.registrationUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch name , email and password from client request
        const { name, email, password } = req.body;
        // check if the email exists
        const isEmailExist = await user_model_1.default.findOne({ email });
        // handle the case
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        // get user in object
        const user = {
            name,
            email,
            password,
        };
        // create activation token
        const activationToken = (0, exports.createActivationToken)(user);
        // get the activation code
        const activationCode = activationToken.activationCode;
        // send user's name and activation code to his mail
        const data = { user: { name: user.name }, activationCode };
        // store in html
        const html = await ejs_1.default.renderFile(
        // platform-agnostic path
        path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        // send the mail
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// create activation token function
const createActivationToken = (user) => {
    // generate a random code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // encrypt the token
    const token = jsonwebtoken_1.default.sign({
        user,
        activationCode,
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
// activate user function
exports.activateUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch code and token from req.body
        const { activation_code, activation_token } = req.body;
        // create a new user
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        // check activation code of the new user
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid Activation Code", 400));
        }
        // fetch name , email and password of the new user
        const { name, email, password } = newUser.user;
        // check if the newUser already exist in the db?
        const existUser = await user_model_1.default.findOne({ email });
        // handle case if user already exist
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        // if user does not exits then create the document for that user
        const user = await user_model_1.default.create({
            name,
            email,
            password,
        });
        // send the JSON response
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch email and passowrd from client
        const { email, password } = req.body;
        // check for both
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email or password", 400));
        }
        // fetch user from db based on the email
        const user = await user_model_1.default.findOne({ email }).select("+password");
        // if user is not fetched , the email or passwors is invalid
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        // check password
        const isPasswordMatch = await user.comparePassword(password);
        // handle case for wrong password
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        //send the token to cookie and as response to the client and store session in redis
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// logout user
exports.logoutUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // override the existing key in our cookies to empty value
        // to end session
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        // get the userID
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        // test postman
        // then go to auth.ts middleware
        res.status(200).json({
            success: true,
            message: "Logged Out Successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
exports.updateAccessToken = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        console.log("getting refresh token");
        // get refresh token from string
        const refresh_token = req.cookies.refresh_token;
        console.log("got refresh token- ", refresh_token);
        // verify and get decoded token
        console.log("verifying refresh token");
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        // handle case
        // console.log("this done");
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        console.log("verified refressh token");
        // get the session from redis
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login for accessing this resources!", 400));
        }
        // get the user object
        const user = JSON.parse(session);
        // generate new access and refresh tokens
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "5m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d",
        });
        // add user to req body
        req.user = user;
        // set access and refresh token to our cookie
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7days
        // res.status(200).json({
        //   success: true,
        //   accessToken,
        // });
        return next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get user info
exports.getUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get user id from user
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        throw next(new ErrorHandler_1.default(error.message, 400));
    }
});
// social auth
exports.socialAuth = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get name,email and avatar form client
        const { email, name, avatar } = req.body;
        // get the user
        const user = await user_model_1.default.findOne({ email });
        // if user not there then create new account for him
        if (!user) {
            const newUser = await user_model_1.default.create({ name, email, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        throw next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get name and email from body
        const { name, email } = req.body;
        // take the user id
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        // update email
        if (email && user) {
            const isEmailExist = await user_model_1.default.findOne({ email });
            if (!isEmailExist) {
                return next(new ErrorHandler_1.default("Email already exists!", 400));
            }
            user.email = email;
        }
        // update name
        if (name && user) {
            user.name = name;
        }
        // save changes to our database
        await user?.save();
        // update user cache
        await redis_1.redis.set(userId, JSON.stringify(user));
        // send the response
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updatePassword = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new Password", 400));
        }
        // get the user with password
        const user = await user_model_1.default.findById(req.user?._id).select("+password");
        // handle case in case of social auth
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid User", 400));
        }
        // check if password correct or not
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        // reset password
        user.password = newPassword;
        // save in database
        await user.save();
        // save in the cache
        await redis_1.redis.set(req.user?.id, JSON.stringify(user));
        // send response
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateProfilePicture = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        //get user
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId).select("+avatar");
        // if user and avatar are provided
        // console.log("user", avatar);
        if (user && avatar) {
            // if user already has one avatar
            if (user?.avatar?.public_id) {
                // first delete the old avatar
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
                // upload it to my cloud
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                // set user's avatar
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
                console.log("hey", user.avatar);
            }
            else {
                // upload new image
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
                console.log("hello", user.avatar);
            }
        }
        // save user to db
        await user?.save();
        // save it in the cache
        await redis_1.redis.set(userId, JSON.stringify(user));
        // send the response
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        throw next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all courses only for admin
exports.getAllUsers = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// allow admin to cahnge users roel
exports.updateUserRole = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const isUserExist = await user_model_1.default.findOne({ email });
        if (isUserExist) {
            const id = isUserExist._id;
            (0, user_service_1.updateUserRoleService)(res, id, role);
        }
        else {
            res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// allow admin to delete a user from his course
exports.deleteUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get id from param
        const { id } = req.params;
        // console.log(id);
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted succesfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
