/**
 * Return a sanitized user object for API responses (omits sensitive fields).
 *
 * @param {Object} user - Database user document
 * @param {Date} [date] - Optional override for `updatedAt`
 * @returns {Object} Sanitized user object suitable for responses
 */
const appUser = (user, date) => {
  const {createdAt, updatedAt, _id, email, username} = user;
  if (!date) {
    date = updatedAt;
  };
  return {
    id: _id,
    email: email,
    username: username,
    updatedAt: date,
    createdAt: createdAt
  };
};

export default appUser;
