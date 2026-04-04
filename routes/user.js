import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as reviewsController from '../controllers/reviewsController.js';
import * as userController from '../controllers/userController.js';
import authHandler from '../middleware/auth.js';

const router = express.Router();

// utils
router.use(cookieParser());
// security
router.use(mongoSanitize());

router.get('/', authHandler, userController.getUser);

router.delete('/', authHandler, userController.deleteUser);

router.put('/', authHandler, userController.updateUser);

// reviews
router.get('/:userId/reviews', reviewsController.getReviewsFromUserId);

export default router;
