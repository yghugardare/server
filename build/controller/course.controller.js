"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscript = exports.generateVideoUrl = exports.deleteCourse = exports.getAdminAllCourses = exports.addReplyToReview = exports.addReview = exports.addAnwser = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
const ai_model_1 = require("../models/ai.model");
// upload course
exports.uploadCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            // add thumbnail to the data
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// edit the course
exports.editCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = (await course_model_1.default.findById(courseId));
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get single course w/o purchasing
exports.getSingleCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        // get course cache ,JSON
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            // debug
            // console.log("redis hitt");
            // make it object
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            // console.log("mongodb hit");
            // get the course
            const course = await course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            // set course to redis , so that next time info is rendered directly from the cache
            // expiration time of 60x60x24x7 = 604800 = 7days, for the course data
            // advance cache
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all courses
exports.getAllCourses = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // dont store in cache
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course content only for those who purchased it
exports.getCourseByUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch user course list
        const userCourseList = req.user?.courses;
        // console.log(req.user?.name)
        // console.log(userCourseList)
        // get course id from param url
        const courseId = req.params.id;
        // has the user purchased?
        //if he is user then
        if (req.user?.role === "user") {
            const courseExists = userCourseList?.find((course) => course._id.toString() === courseId);
            if (!courseExists) {
                return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
            }
        }
        // get course
        const course = await course_model_1.default.findById(courseId);
        // get constent
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch question from client
        const { question, courseId, contentId } = req.body;
        // get the course from course id
        const course = await course_model_1.default.findById(courseId);
        // check if the content id is valid or not
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content Id", 400));
        }
        // get the course content
        const courseContent = course?.courseData?.find((item) => {
            return item._id.equals(contentId);
        });
        // if course content not found
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content Id", 400));
        }
        // create a new question
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add questionn to course content
        courseContent.questions.push(newQuestion);
        // send notfication for the question to the admin
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Question Received",
            message: `You have a new question in ${courseContent.title}`,
        });
        //save the course conten to mongo db
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnwser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // fetch answer for frontend
        const { answer, courseId, contentId, questionId } = req.body;
        // get the course from course id
        const course = await course_model_1.default.findById(courseId);
        // check if the content id is valid or not
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content Id", 400));
        }
        // get the course content
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        // if course content not found
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content Id", 400));
        }
        // search question
        const question = courseContent?.questions?.find((item) => item._id.equals(questionId));
        // handle case
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid Question Id", 400));
        }
        // create  a new answer object
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // add answer to course content
        question.questionReplies.push(newAnswer);
        // save to data base
        await course?.save();
        // if i am replying to my own question then no need to send me mail
        if (req.user?._id === question.user?._id) {
            // create a notification
            console.log("Same ho");
            await notification_model_1.default.create({
                user: req.user?._id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent.title}`,
            });
        }
        else {
            // send mail
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            // use ejs to render html file with data
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            // send mail
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
        }
        // send response
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// add review and ratings in course
exports.addReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get course list and course id
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        // check if course exist based on course id
        const courseExists = userCourseList?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        // get gourse
        const course = await course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            rating,
            comment: review,
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        await course?.save();
        // const notification = {
        //   // user: req.user?._id,
        //   title: "New Review Received",
        //   message: `${req.user?.name} has given a review in ${course?.name}`,
        // };
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days
        // create notification
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Review Received",
            message: `${req.user?.name} has given a review in ${course?.name}`,
        });
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        // get data from client
        const { comment, courseId, reviewId } = req.body;
        // get course from mongo db
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        // console.log(course)
        // get review from the course
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const replyData = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        // push reply to comment replies
        review.commentReplies?.push(replyData);
        // save to ddb
        await course?.save();
        // await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all course related info for admin
exports.getAdminAllCourses = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete course for admin
exports.deleteCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 404));
        }
        await course.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "course deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, // expiry
        {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// function to get transcript and course name from course
exports.getTranscript = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { videoName } = req.body;
        // console.log(videoName);
        const course = await course_model_1.default.findById(id);
        const courseName = course?.name;
        const ai = await ai_model_1.AIModel.findOne({ title: videoName });
        // console.log(ai, "ai");
        const transcript = ai?.transcription;
        res.status(200).json({
            success: true,
            transcript,
            courseName
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
