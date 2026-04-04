import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';

import appError from './appError.js';

const usersCollection = database.collection('users');

/**
 * Authenticates a user by email and password.
 * Verifies the user exists and password matches the hashed password stored in
 * the database.
 *
 * @async
 * @param {string} param - The user's email address or id
 * @param {string} password - The user's plaintext password
 * @returns {Promise<Object>} The user object with _id, email, username, and
 *     timestamp fields
 * @throws {Error} appError with UNAUTHORIZED status if user not found or
 *     password doesn't match
 */
const userAuthentication = async (param, password) => {
  const {email, id} = param;
  let user;
  if (email) {
    user = await usersCollection.findOne({email: email});
  } else if (id && ObjectId.isValid(id)) {
    user = await usersCollection.findOne({_id: new ObjectId(id)});
  } else {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  if (!user) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw appError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  };
  return user;
};

export default userAuthentication;
