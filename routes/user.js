import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as reviewsController from '../controllers/reviewsController.js';
import * as userController from '../controllers/userController.js';
import authHandler from '../middleware/auth.js';

// User routes under /api/user.
// Manage the authenticated user's profile and list a user's reviews.
// Cookies are parsed and request payloads are sanitized.
const router = express.Router();

// Parse cookies for profile-related operations.
router.use(cookieParser());
// Sanitize payloads to mitigate injection risks.
router.use(mongoSanitize());

router.get('/', authHandler, userController.getUser);

router.delete('/', authHandler, userController.deleteUser);

router.put('/', authHandler, userController.updateUser);

// User review listing
router.get('/:userId/reviews', reviewsController.getReviewsFromUserId);

export default router;
