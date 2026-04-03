import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';
import joi from 'joi';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import appUser from '../utils/appUser.js';


const saltRounds = 10;

const usersCollection = database.collection('users');
// GET /auth/user retrieves the authenticated user's profile information.
// Requires : AccessToken
export const getUser = asyncHandler(async (req, res, next) => {
  const id = new ObjectId(req.user.id);
  let user = await usersCollection.findOne({_id: id});
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json({user: appUser(user)});
});

// DELETE /auth/user deletes the authicated user's profile.
// Requires : AccessToken & Password
export const deleteUser = asyncHandler(async (req, res, next) => {
  const {password} = req.body;
  const id = new ObjectId(req.user.id);
  let user = await usersCollection.findOne({_id: id});
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  }
  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }
  await usersCollection.deleteOne({_id: id});

  await database.collection('refreshToken').deleteMany({userId: req.user.id});
  res.status(StatusCodes.NO_CONTENT).send();
});

// PUT /auth/user updates the authenticated
// user's profile information (users password for now)
// Requires : AccessToken & Password
export const updateUser = asyncHandler(async (req, res, next) => {
  const {currentPassword, newPassword} = req.body;
  if (newPassword) {
    const schema = joi.object({
      newPassword: joi.string()
                       .min(8)
                       .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
                       .required()
    });
    const {error} = schema.validate({newPassword});
    if (error) return res.status(400).json({message: error.details[0].message});
  }
  const id = new ObjectId(req.user.id);
  const user = await usersCollection.findOne({_id: id});
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  if (newPassword) {
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const now = new Date();
    await usersCollection.updateOne(
        {_id: id}, {$set: {hashedPassword: newHashedPassword, updatedAt: now}});
  }
  const updatedUser = await usersCollection.findOne({_id: id});
  res.status(StatusCodes.OK).json({user: appUser(updatedUser)});
});
