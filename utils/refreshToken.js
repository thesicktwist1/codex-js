import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import database from '../db/conn';

const expiration = 7;
const refreshSecret = process.env.REFRESH_SECRET;

const generateRefreshToken = async (userId) => {
  try {
    let refreshTknCollection = database.collection('refreshToken');
    let findResult = refreshTknCollection.find({userID: userId});
    const now = new Date();
    const expiredTkns = [];
    for await (const token of findResult) {
      if (token.expiresAt < now) {
        expiredTkns.push(token);
      };
    };
    await refreshTknCollection.deleteMany(expiredTkns);
    const token = jwt.sign({userId: userId}, refreshSecret, {expiresIn: '7d'});
    const hashedToken = await bcrypt.hash(token, 10);
    await refreshTknCollection.insertOne({
      userId: userId,
      hashedToken: hashedToken,
      createdAt: now,
      expiresAt: new Date(now.getDate() + expiration),
    });
    return token;
  } catch (err) {
    throw err;
  };
};

const deleteRefreshToken = async (token) => {
  try {
    let refreshTknCollection = database.collection('refreshToken');
    await refreshTknCollection.deleteOne({token: token});
  } catch (err) {
    throw err;
  };
};

export default {generateRefreshToken, deleteRefreshToken};
