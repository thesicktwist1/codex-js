import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';
import joi from 'joi';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import appUser from '../utils/appUser.js';
import validateSchema from '../utils/joiSchemas.js';
import userAuthentication from '../utils/userAuth.js';


const saltRounds = 10;

const usersCollection = database.collection('users');
// GET /auth/user retrieves the authenticated user's profile information.
// Requires : AccessToken
export const getUser = asyncHandler(async (req, res, _next) => {
  const id = new ObjectId(req.user.id);
  let user = await usersCollection.findOne({_id: id});
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json({user: appUser(user)});
});

// DELETE /auth/user deletes the authicated user's profile.
// Requires : AccessToken & Password
export const deleteUser = asyncHandler(async (req, res, _next) => {
  const {password} = req.body;
  const user = await userAuthentication({id: req.user.id}, password);
  await usersCollection.deleteOne({_id: user.id});
  await database.collection('refreshToken').deleteMany({userId: req.user.id});
  res.status(StatusCodes.NO_CONTENT).send();
});

// PUT /auth/user updates the authenticated
// user's profile information (users password for now)
// Requires : AccessToken & Password
export const updateUser = asyncHandler(async (req, res, _next) => {
  const {currentPassword, newPassword} = req.body;
  const error = validateSchema('updateUser', req.body);
  if (error) {
    throw error;
  };
  const user = await userAuthentication({id: req.user.id}, currentPassword);
  const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
  await usersCollection.updateOne(
      {_id: user._id},
      {$set: {hashedPassword: newHashedPassword, updatedAt: new Date()}});
  const updatedUser = await usersCollection.findOne({_id: user._id});
  res.status(StatusCodes.OK).json({user: appUser(updatedUser)});
});
