import express from 'express';

import * as reviewsController from '../controllers/reviewsController.js'
import authHandler from '../middleware/auth.js';

const router = express.Router();


router.get('/:id', reviewsController.getReview);

router.get('/', reviewsController.getReviews);

router.get('/:id', authHandler, reviewsController.updateReview);


export default router;
