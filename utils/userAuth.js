import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';

import database from '../db/conn.js';

import appError from './appError.js';

const usersCollection = database.collection('users');

const userAuthentication = async (email, password) => {
  const user = await usersCollection.findOne({email: email});
  if (!user) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  return user;
};

export default userAuthentication;
