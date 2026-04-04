import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30m'

const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtSecret, {expiresIn: jwtExpiresIn})
};

export default generateAccessToken;
