import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as authController from '../controllers/authController.js';
import authHandler from '../middleware/auth.js';

// Authentication routes mounted at /api/auth.
// Parses cookies and sanitizes input to reduce injection risks.
const router = express.Router();
// Parse cookies (used for refresh token handling).
router.use(cookieParser());
// Sanitize request payloads to prevent MongoDB operator injection.
router.use(mongoSanitize());

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh', authController.refresh);

router.post('/revoke', authHandler, authController.revoke);

export default router;
