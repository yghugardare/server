"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
require("dotenv").config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Redis Connected`);
        return process.env.REDIS_URL;
    }
    throw new Error("Redis Connection failed!");
};
exports.redis = new ioredis_1.Redis(redisClient());
// import { Redis } from 'ioredis';
// require('dotenv').config();
// const redis = new Redis({
//   url: process.env.REDIS_URL,
//   token: process.env.REDIS_TOKEN
// });
// redis.on('connect', () => console.log('Redis Connected'));
// redis.on('error', (err) => {
//   console.error('Redis connection error:', err);
//   process.exit(1);
// });
// export default redis;
