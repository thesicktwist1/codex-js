import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as reviewsController from '../controllers/reviewsController.js';
import authHandler from '../middleware/auth.js';

const router = express.Router();

// utils
router.use(cookieParser());
// security
router.use(mongoSanitize());

router.get('/:id', reviewsController.getReview);

router.get('/', reviewsController.getReviews);


router.use(authHandler);

router.put('/:id', reviewsController.updateReview);

router.delete('/:id', reviewsController.deleteReview);


export default router;
