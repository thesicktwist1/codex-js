import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as authController from '../controllers/authController.js';
import authHandler from '../middleware/auth.js';


const router = express.Router();
// utils
router.use(cookieParser());
// security
router.use(mongoSanitize());

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh', authController.refresh);

router.post('/revoke', authHandler, authController.revoke);

export default router;
