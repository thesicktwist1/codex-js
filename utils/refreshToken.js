import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import database from '../db/conn.js';

const expiration = 7;
const refreshSecret = process.env.REFRESH_SECRET;
const saltRounds = 10;

export const generateRefreshToken = async (userId) => {
  try {
    let refreshTknCollection = database.collection('refreshToken');
    let findResult =
        await refreshTknCollection.find({userId: userId}).toArray();
    const now = new Date();
    const expiredTkns = [];
    for await (const token of findResult) {
      if (token.expiresAt < now) {
        expiredTkns.push(token._id);
      };
    };
    await refreshTknCollection.deleteMany(expiredTkns);
    const token = jwt.sign(
        {userId: userId},
        refreshSecret,
        {expiresIn: '7d'},
    );
    const hashedToken = await bcrypt.hash(token, saltRounds);
    await refreshTknCollection.insertOne({
      userId: userId,
      hashedToken: hashedToken,
      expiresAt: new Date(now.getDate() + expiration),
    });
    return token;
  } catch (err) {
    throw err;
  };
};

export const deleteRefreshToken = async (userId, oldToken) => {
  try {
    let refreshTknCollection = database.collection('refreshToken');
    let tokens = refreshTknCollection.find({userId: userId});
    for await (const token of tokens) {
      const isMatch = await bcrypt.compare(oldToken, token.hashedToken);
      if (isMatch) {
        await refreshTknCollection.deleteOne({_id: token._id});
        break;
      };
    };
  } catch (err) {
    throw err;
  };
};
