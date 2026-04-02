import {StatusCodes} from 'http-status-codes';
import jwt from 'jsonwebtoken';

import appError from '../utils/error.js';

const jwtSecret = process.env.JWT_SECRET;

const authHandler = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header.split(' ')[1];
  if (!header || !token) {
    const msg = header ? 'Malformed authorization header' :
                         'No authorization token included';
    throw appError(msg, StatusCodes.UNAUTHORIZED);
  };
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      throw appError('Invalid or expired token', StatusCodes.UNAUTHORIZED);
    }
    req.user = {id: decoded.userId};
    next();
  });
};

export default authHandler;
