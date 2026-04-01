import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import database from '../db/conn.js';
import generateAccessToken from '../utils/accessToken.js';
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
  res.clearCookie('refreshToken');
};

// POST /auth/refresh generates a new JWT token
// using the given refresh token
// Requires: RefreshToken
export const refresh = async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw appError('No refresh-token included', 401);
  };
  let userId;
  jwt.verify(token, refreshSecret, async (err, decoded) => {
    if (err) {
      throw appError('Invalid or expired refresh token', 403)
    };
    userId = decoded.userId;
  });
  let refreshTknCollection = database.collection('refreshToken');
  let findResult = refreshTknCollection.find({userId: userId})
  let refreshToken;
  for await (const result of findResult) {
    const isMatch = bcrypt.compare(token, result.hashedToken);
    if (isMatch) {
      refreshToken = result;
      break;
    }
  };
  if (!refreshToken) {
    throw appError('Invalid credentials', 401);
  };
  const newAccessToken = generateAccessToken({userId: userId});
  res.status(200).json({accessToken: newAccessToken});
};

// POST /auth/login handles user authentication by validating credentials and
// issuing JWT and refresh tokens. It expects a JSON payload containing a user
// key and password. On successful authentication, it returns a JWT token and
// refresh token along with user information.
export const login = async (req, res, next) => {
  const {email, password} = req.body;
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({email: email});
  let isMatch = await bcrypt.compare(password, user.hashedPassword || '');
  if (!isMatch) {
    throw appError('Invalid credentials', 401)
  }
  let refreshToken = await generateRefreshToken(result._id);
  const newAccessToken = generateAccessToken({userId: result._id});
  res.cookie(
      'refreshToken', refreshToken,
      {httpOnly: true, secure: false, sameSite: 'strict'});
  res.status(200).json({user: appUser(user), accessToken: newAccessToken});
};

// POST /auth/register creates a new user account with email, username, and
// password. It validates input credentials, checks for existing users, and
// stores the hashed password.
export const register = async (req, res, next) => {
  const {email, username, password} = req.body;
  let usersCollection = database.collection('users');
  let exists = await usersCollection.countDocuments({email: email}) > 0;
  if (exists) {
    throw appError('User already exists', 401);
  }
  const createdAt = new Date();
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  let result = await usersCollection.insertOne({
    email: email,
    username: username,
    password: hashedPassword,
    createdAt: createdAt,
    updatedAt: createdAt
  });
  res.status(201).json({user: appUser(user)});
};

// GET /auth/user retrieves the authenticated user's profile information.
// Requires : AccessToken
export const getUser = async (req, res, next) => {
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({userId: req.user.id})
  if (!user) {
    throw appError('No user found', 500);
  };
  res.status(200).json({user: appUser(user)});
};

// DELETE /auth/user deletes the authicated user's profile.
// Requires : AccessToken & Password
export const deleteUser = async (req, res, next) => {
  const {password} = req.body;
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({userId: req.user.id})
  if (!user) {
    throw appError('No user found', 500);
  };
  const isMatch = bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', 401);
  };
  await usersCollection.deleteOne({_id: user._id});
  let refreshTknCollection = database.collection('refreshToken');
  await refreshTknCollection.deleteMany({userId: user._id});
  res.status(204);
};

// PUT /auth/user updates the authenticated
// user's profile information (users password for now)
// Requires : AccessToken & Password
export const updateUser = async (req, res, next) => {
  const {password} = req.body;
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({userId: req.user.id})
  if (!user) {
    throw appError('No user found', 500);
  };
  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', 401);
  };
  const newHashedPassword = await bcrypt.hash(password, saltRounds);
  const now = new Date();
  await usersCollection.updateOne({_id: req.user.id}, {
    email: user.email,
    username: user.username,
    password: newHashedPassword,
    createdAt: user.createdAt,
    updatedAt: now
  })
  res.status(202).json(appUser(user, now));
};
