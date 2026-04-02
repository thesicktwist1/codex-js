
import express from 'express';

import * as booksController from '../controllers/booksController.js'
import * as reviewsController from '../controllers/reviewsController.js'

const router = express.Router();


router.get('/:bookId', booksController.getBook);

router.get('/', booksController.getBooks);

router.post('/', booksController.createBook);

// reviews
router.post('/:bookId/reviews', reviewsController.createReview);
router.get('/:bookId/reviews', reviewsController.getReviewsFromBookId);

export default router;
