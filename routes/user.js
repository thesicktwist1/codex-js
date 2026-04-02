import express from 'express';

import * as reviewsController from '../controllers/reviewsController.js'
import * as userController from '../controllers/userController.js'
import authHandler from '../middleware/auth.js';

const router = express.Router();

router.get('/user', authHandler, userController.getUser);

router.delete('/user', authHandler, userController.deleteUser);

router.put('/user', authHandler, userController.updateUser);

// reviews
router.get('/:userId/reviews', reviewsController.getReviewsFromUserId);

export default router;
