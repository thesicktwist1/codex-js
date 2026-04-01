import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET
const jwtExpiresIn = '30m'

const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtSecret, {expiresIn: jwtExpiresIn})
};

export default generateAccessToken;
