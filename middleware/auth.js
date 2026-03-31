import jwt from 'jsonwebtoken';

import database from '../db/conn';

const jwtSecret = process.env.JWT_SECRET;

const authHandler = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header.split(' ')[1];
  if (!header || !token) {
    const msg = header ? 'Malformed authorization header' :
                         'No authorization token included';
    const error = new Error(msg);
    error.status = 401;
    throw error;
  };
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      const error = new Error('Invalid or expired token');
      error.status = 401;
      throw error;
    }
    req.user = user;
    next();
  });
};

export default authHandler;
