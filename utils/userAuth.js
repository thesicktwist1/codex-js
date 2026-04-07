import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';

import appError from './appError.js';

const usersCollection = database.collection('users');

/**
 * Authenticate a user by email or id and verify the plaintext password.
 *
 * Looks up the user and validates the bcrypt-hashed password. Throws an
 * `appError` when the user is not found or credentials are invalid.
 *
 * @async
 * @param {Object} param - Object containing `email` or `id` to locate user
 * @param {string} password - Plaintext password to verify
 * @returns {Promise<Object>} The user document on success
 * @throws {Error} appError when authentication fails
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
