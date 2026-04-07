import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as reviewsController from '../controllers/reviewsController.js';
import authHandler from '../middleware/auth.js';

// Review routes under /api/reviews.
// Read endpoints are public; write operations require authentication.
// All requests are sanitized.
const router = express.Router();

// Parse cookies where needed.
router.use(cookieParser());
// Sanitize request payloads to prevent MongoDB operator injection.
router.use(mongoSanitize());


router.get('/:id', reviewsController.getReview);

router.get('/', reviewsController.getReviews);


router.use(authHandler);

router.put('/:id', reviewsController.updateReview);

router.delete('/:id', reviewsController.deleteReview);


export default router;
