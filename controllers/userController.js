import {StatusCodes} from 'http-status-codes';

import database from '../db/conn.js';
import appError from '../utils/error.js';
import appUser from '../utils/user.js';

// GET /auth/user retrieves the authenticated user's profile information.
// Requires : AccessToken
export const getUser = async (req, res, next) => {
  const id = ObjectId(req.user.id);
  let user = await database.collection('users').findOne({_id: id})
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json({user: appUser(user)});
};

// DELETE /auth/user deletes the authicated user's profile.
// Requires : AccessToken & Password
export const deleteUser = async (req, res, next) => {
  const {password} = req.body;
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({userId: req.user.id})
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  const isMatch = bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  await usersCollection.deleteOne({_id: user._id});

  await database.collection('refreshToken').deleteMany({userId: req.user.id});
  res.status(StatusCodes.NO_CONTENT);
};

// PUT /auth/user updates the authenticated
// user's profile information (users password for now)
// Requires : AccessToken & Password
export const updateUser = async (req, res, next) => {
  const {password} = req.body;
  let usersCollection = database.collection('users');
  let user = await usersCollection.findOne({userId: req.user.id})
  if (!user) {
    throw appError('No user found', StatusCodes.NOT_FOUND);
  };
  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
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
  res.status(StatusCodes.CREATED).json(appUser(user, now));
};
