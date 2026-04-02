import bcrypt from 'bcrypt'
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken'

import database from '../db/conn.js';
import generateAccessToken from '../utils/accessToken.js';
import databaseObject from '../utils/dbObject.js';
import appError from '../utils/error.js';
import {deleteRefreshToken, generateRefreshToken} from '../utils/refreshToken.js'
import appUser from '../utils/user.js';


const saltRounds = 10;

// POST /auth/revoke invalidates a refresh token by deleting it
// This logs out the user by preventing token renewal.
// Requires : AccessToken
export const revoke = async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await deleteRefreshToken(req.user.id, token);
  }
  res.status(StatusCodes.NO_CONTENT).clearCookie('refreshToken');
};

// POST /auth/refresh generates a new JWT token
// using the given refresh token
// Requires: RefreshToken
export const refresh = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw appError('No refresh-token included', StatusCodes.UNAUTHORIZED);
  };
  let userId;
  jwt.verify(token, refreshSecret, async (err, decoded) => {
    if (err) {
      throw appError(
          'Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    };
    userId = decoded.userId;
  });
  let findResult = await database.collection('refreshToken')
                       .find({userId: userId})
                       .toArray();
  let token;
  for await (const result of findResult) {
    let isMatch = await bcrypt.compare(token, result.hashedToken);
    if (isMatch) {
      token = result;
      break;
    };
  };
  if (!token) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  const newAccessToken = generateAccessToken({userId: userId});
  res.status(StatusCodes.ACCEPTED).json({accessToken: newAccessToken});
};

// POST /auth/login handles user authentication by validating credentials and
// issuing JWT and refresh tokens. It expects a JSON payload containing a user
// key and password. On successful authentication, it returns a JWT token and
// refresh token along with user information.
export const login = async (req, res, next) => {
  const {email, password} = req.body;
  let user = await database.collection('users').findOne({email: email});
  let isMatch = await bcrypt.compare(password, user.hashedPassword || '');
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }
  let refreshToken = await generateRefreshToken(result._id);
  const newAccessToken = generateAccessToken({userId: result._id});
  res.cookie(
      'refreshToken', refreshToken,
      {httpOnly: true, secure: false, sameSite: 'strict'});
  res.status(StatusCodes.ACCEPTED)
      .json({user: appUser(user), accessToken: newAccessToken});
};

// POST /auth/register creates a new user account with email, username, and
// password. It validates input credentials, checks for existing users, and
// stores the hashed password.
export const register = async (req, res, next) => {
  const {email, username, password} = req.body;
  let usersCollection = database.collection('users');
  let exists = await usersCollection.findOne({email: email});
  if (exists) {
    throw appError('User already exists', StatusCodes.UNAUTHORIZED);
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  let result = await usersCollection.insertOne(databaseObject({
    email: email,
    username: username,
    password: hashedPassword,
  }));
  res.status(StatusCodes.ACCEPTED).json({user: appUser(result)});
};
