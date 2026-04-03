import bcrypt from 'bcrypt'
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken'

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import generateAccessToken from '../utils/accessToken.js';
import appError from '../utils/appError.js';
import appUser from '../utils/appUser.js';
import databaseObject from '../utils/dbObject.js';
import validateSchema from '../utils/joiSchemas.js';
import {deleteRefreshToken, generateRefreshToken} from '../utils/refreshToken.js'
import userAuthentication from '../utils/userAuth.js';

const refreshSecret = process.env.REFRESH_SECRET;
const secure = process.env.NODE_ENV === 'production';

const usersCollection = database.collection('users');
const refreshTknsCollection = database.collection('refreshToken');
const saltRounds = 10;


export const revoke = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await deleteRefreshToken(token);
  };
  res.status(StatusCodes.NO_CONTENT).clearCookie('refreshToken');
});


export const refresh = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw appError('No refresh-token included', StatusCodes.UNAUTHORIZED);
  }
  let user;
  jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
    if (err) {
      throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    };
    user = {id: decoded.userId, session: decoded.session};
  });
  const token = await refreshTknsCollection.findOne(
      {userId: user.id, session: user.session});
  if (!token) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }
  const isMatch = await bcrypt.compare(refreshToken, token.hashedToken);
  if (!isMatch || (token.expiresAt < new Date())) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }
  const newAccessToken = generateAccessToken({userId: user.id});
  res.status(StatusCodes.OK).json({accessToken: newAccessToken});
});

export const login = asyncHandler(async (req, res, next) => {
  const error = validateSchema('login', req.body);
  if (error) {
    throw error;
  };
  const {email, password} = req.body;
  const user = await userAuthentication(email, password);
  const refreshToken = await generateRefreshToken(user._id);
  const newAccessToken = generateAccessToken({userId: user._id});
  res.cookie(
      'refreshToken', refreshToken,
      {httpOnly: true, secure: secure, sameSite: 'strict'});
  res.status(StatusCodes.OK)
      .json({user: appUser(user), accessToken: newAccessToken});
});

// POST /auth/register creates a new user account with email, username, and
// password. It validates input credentials, checks for existing users, and
// stores the hashed password.
export const register = asyncHandler(async (req, res, next) => {
  const error = validateSchema('register', req.body);
  if (error) {
    throw error;
  };
  const {email, username, password} = req.body;
  const exists = await usersCollection.findOne({email: email});
  if (exists) {
    throw appError('User already exists', StatusCodes.UNAUTHORIZED);
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  let result = await usersCollection.insertOne(databaseObject(
      {
        email: email,
        username: username,
        hashedPassword: hashedPassword,
      },
      true));
  const insertedUser = await usersCollection.findOne({_id: result.insertedId});
  res.status(StatusCodes.CREATED).json({user: appUser(insertedUser)});
});
