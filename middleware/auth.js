import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';

import appError from '../utils/appError.js';

/**
 * Authentication middleware.
 *
 * Verifies the `Authorization: Bearer <token>` header, validates the JWT
 * using `JWT_SECRET`, and attaches `req.user = {id}` on success. Errors are
 * forwarded to the error handler using `appError`.
 */
const jwtSecret = process.env.JWT_SECRET;

const authHandler = (req, res, next) => {
  try {
    const header = req.headers['authorization'];
    if (!header) {
      throw appError(
          'No authorization token included', StatusCodes.UNAUTHORIZED);
    }
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw appError(
          'Malformed authorization header', StatusCodes.UNAUTHORIZED);
    }
    const token = parts[1];
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded?.userId) {
      throw appError('Invalid or expired token', StatusCodes.UNAUTHORIZED);
    }
    req.user = {id: decoded.userId};
    next();
  } catch (err) {
    next(err);
  }
};

export default authHandler;
