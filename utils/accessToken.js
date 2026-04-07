import jwt from 'jsonwebtoken'

/**
 * Create short-lived JWT access tokens signed with `JWT_SECRET`.
 * Expiration can be configured with `JWT_EXPIRES_IN` (default: `30m`).
 */
const jwtSecret = process.env.JWT_SECRET
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30m'

const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtSecret, {expiresIn: jwtExpiresIn})
};

export default generateAccessToken;
