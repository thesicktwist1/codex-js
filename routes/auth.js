
import cookieParser from 'cookie-parser';
import express from 'express';

import * as authController from '../controllers/authController.js';
import authHandler from '../middleware/auth.js';


const router = express.Router();

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/refresh', authController.refresh);

router.post('/revoke', authHandler, authController.revoke);

router.get('/user', authHandler, authController.getUser);

router.delete('/user', authHandler, authController.deleteUser);

router.put('/user', authHandler, authController.updateUser);

export default router;
