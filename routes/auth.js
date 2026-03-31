import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';

import database from '../db/conn';
import asyncHandler from '../middleware/async';
import errorHandler from '../middleware/error';
import appError from '../utils/error';
import {deleteRefreshToken, generateRefreshToken} from '../utils/refreshToken'



const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();
router.use(cookieParser());

const saltRounds = 10;

// Handles user authentication by validating credentials and issuing JWT and
// refresh tokens. It expects a JSON payload containing a user key and password.
// On successful authentication, it returns a JWT token and refresh token along
// with user information.
router.post('/login', async (req, res, next) => {
  const {email, password} = req.body;
  let usersCollection = database.collection('users');
  let result = await usersCollection.findOne({email: email});
  let isMatch = await bcrypt.compare(password, result.hashedPassword || '');
  if (!isMatch) {
    throw appError('Invalid credentials', 401)
  }
  let refreshToken = await generateRefreshToken(result._id);
  const user = {
    id: result._id,
    username: result.username,
    email: email,
  };
  let jwtToken = jwt.sign(user, jwtSecret, {expiresIn: '30m'});
  res.cookie(
      'refreshToken', refreshToken,
      {httpOnly: true, secure: false, sameSite: 'strict'});
  res.status(200).json({user: user, accessToken: jwtToken});
});

// Creates a new user account with email, username, and password.
// It validates input credentials, checks for existing users, and stores the
// hashed password.
router.post('/register', async (req, res, next) => {
  const {email, username, password} = req.body;
  let usersCollection = await database.collection('users');
  let exists = await usersCollection.countDocuments({email}) > 0;
  if (exists) {
    throw appError('User already exists', 401);
  }
  const createdAt = new Date().toString();
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  await usersCollection.insertOne({
    email: email,
    username: username,
    password: hashedPassword,
    createdAt: createdAt,
    updatedAt: createdAt
  });
  res.status(201);
});


router.post('/refresh', async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw appError('No refresh-token included', 401);
  };
  jwt.verify(token, refreshSecret, async (err, decoded) => {
    if (err) {
      throw appError('Invalid or expired refresh token', 403)
    };
  });
});

router.post('/revoke', async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await deleteRefreshToken();
  }
  res.clearCookie('refreshToken');
  res.json({message: 'log out successful'});
});

export default router;
