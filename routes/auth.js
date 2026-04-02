
import express from 'express';

import * as authController from '../controllers/authController.js';
import authHandler from '../middleware/auth.js';


const router = express.Router();

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh', authController.refresh);

router.post('/revoke', authHandler, authController.revoke);

export default router;
