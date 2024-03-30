"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const course_model_1 = __importDefault(require("../models/course.model"));
exports.createCourse = (0, catchAsyncError_1.CatchAsyncError)(async (data, res) => {
    // create document in courses collection
    const course = await course_model_1.default.create(data);
    // send the response
    res.status(201).json({
        success: true,
        course,
    });
});
// get all course service
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
