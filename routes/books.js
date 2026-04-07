import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize'

import * as booksController from '../controllers/booksController.js';
import * as reviewsController from '../controllers/reviewsController.js';
import authHandler from '../middleware/auth.js';

// Books routes under /api/books.
// Parses cookies and sanitizes input for all routes in this router.
const router = express.Router();
// Parse cookies for handlers that rely on cookies.
router.use(cookieParser());
// Sanitize request payloads to mitigate injection attacks.
router.use(mongoSanitize());

router.get('/:bookId', booksController.getBook);

router.get('/', booksController.getBooks);

router.post('/', authHandler, booksController.createBook);

// Nested review routes
router.post('/:bookId/reviews', authHandler, reviewsController.createReview);

router.get('/:bookId/reviews', reviewsController.getReviewsFromBookId);

export default router;
