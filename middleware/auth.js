import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';

import appError from '../utils/appError.js';

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
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      throw appError('Invalid or expired token', StatusCodes.UNAUTHORIZED);
    }

    req.user = {id: decoded.userId};
    next();
  } catch (err) {
    next(err);
  }
};

export default authHandler;
