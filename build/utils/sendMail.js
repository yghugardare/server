"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
require("dotenv").config();
const sendMail = async (options) => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    const { email, subject, template, data } = options;
    // get path to email template
    const templatePath = path_1.default.join(__dirname, "../mails", template);
    // render the email with ejs
    const html = await ejs_1.default.renderFile(templatePath, data);
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    };
    await transporter.sendMail(mailOptions);
};
exports.default = sendMail;
// send mail function
// get destructed cvalue in options
// get path to email template file
// as it is code
/*
require('dotenv').config();
import nodemailer, {Transporter} from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions{
    email:string;
    subject:string;
    template:string;
    data: {[key:string]:any};
}

const sendMail = async (options: EmailOptions):Promise <void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth:{
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const {email,subject,template,data} = options;

    // get the pdath to the email template file
    const templatePath = path.join(__dirname,'../mails',template);

    // Render the email template with EJS
    const html:string = await ejs.renderFile(templatePath,data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;


*/
