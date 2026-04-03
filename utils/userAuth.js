import bcrypt from 'bcrypt';
import {StatusCodes} from 'http-status-codes';

import database from '../db/conn.js';

import appError from './appError.js';

const usersCollection = database.collection('users');

/**
 * Authenticates a user by email and password.
 * Verifies the user exists and password matches the hashed password stored in the database.
 *
 * @async
 * @param {string} email - The user's email address
 * @param {string} password - The user's plaintext password
 * @returns {Promise<Object>} The user object with _id, email, username, and timestamp fields
 * @throws {Error} appError with UNAUTHORIZED status if user not found or password doesn't match
 */
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
