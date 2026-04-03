import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as booksController from '../controllers/booksController.js';
import * as reviewsController from '../controllers/reviewsController.js';
import authHandler from '../middleware/auth.js';

const router = express.Router();
// utils
router.use(cookieParser());
// security
router.use(mongoSanitize());

router.get('/:bookId', booksController.getBook);

router.get('/', booksController.getBooks);

router.post('/', authHandler, booksController.createBook);

// reviews
router.post('/:bookId/reviews', authHandler, reviewsController.createReview);

router.get('/:bookId/reviews', reviewsController.getReviewsFromBookId);

export default router;
