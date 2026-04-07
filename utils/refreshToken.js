/**
 * Refresh token utilities
 *
 * Helpers to generate and revoke refresh tokens. Refresh tokens are stored
 * in the database as hashed values with a per-session UUID to support
 * revocation and token rotation.
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto'
import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';

import database from '../db/conn.js';

import appError from './appError.js';

const expiration = process.env.REFRESH_EXPIRATION_DAYS ?
    parseInt(process.env.REFRESH_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000 :
    7 * 24 * 60 * 60 * 1000;
const refreshSecret = process.env.REFRESH_SECRET;
const saltRounds = 10;

const refreshTknCollection = database.collection('refreshToken');

/**
 * Generate a refresh token for a user and persist a hashed copy.
 *
 * @param {string} userId - The user's MongoDB id
 * @returns {Promise<string>} The raw JWT refresh token
 */
export const generateRefreshToken = async (userId) => {
  const session = crypto.randomUUID();
  const token = jwt.sign(
      {userId: userId, session: session},
      refreshSecret,
      {expiresIn: expiration / 1000},
  );
  const hashedToken = await bcrypt.hash(token, saltRounds);
  await refreshTknCollection.insertOne({
    userId: userId,
    session: session,
    hashedToken: hashedToken,
    expiresAt: new Date(new Date(Date.now() + expiration)),
  });
  return token;
};

/**
 * Verify and delete a stored refresh token matching the raw JWT.
 *
 * @param {string} token - Raw JWT refresh token
 * @returns {Promise<void>}
 */
export const deleteRefreshToken = async (token) => {
  const decoded = jwt.verify(token, refreshSecret);
  if (!decoded?.userId || !decoded.session) {
    throw appError('Malformed token', StatusCodes.BAD_REQUEST);
  };
  await refreshTknCollection.deleteOne(
      {userId: decoded.userId, session: decoded.session});
};
