"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const course_controller_1 = require("../controller/course.controller");
// import { updateAccessToken } from "../controller/user.controller";
// create course router
exports.courseRouter = express_1.default.Router();
exports.courseRouter.post("/create-course", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.uploadCourse);
exports.courseRouter.put("/edit-course/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.editCourse);
exports.courseRouter.get("/get-course/:id", course_controller_1.getSingleCourse);
exports.courseRouter.get("/get-courses", course_controller_1.getAllCourses);
exports.courseRouter.get("/get-course-content/:id", auth_1.isAuthenticated, course_controller_1.getCourseByUser);
exports.courseRouter.put("/add-question", auth_1.isAuthenticated, course_controller_1.addQuestion);
exports.courseRouter.put("/add-answer", auth_1.isAuthenticated, course_controller_1.addAnwser);
exports.courseRouter.put("/add-review/:id", auth_1.isAuthenticated, course_controller_1.addReview);
exports.courseRouter.put("/add-reply", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.addReplyToReview);
exports.courseRouter.get("/get-admin-courses", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.getAdminAllCourses);
exports.courseRouter.delete("/delete-course/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), course_controller_1.deleteCourse);
exports.courseRouter.post("/getVdoCipherOTP", course_controller_1.generateVideoUrl);
exports.courseRouter.post("/ai/:id", course_controller_1.getTranscript);
