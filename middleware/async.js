/**
 * Wrap async route handlers to forward promise rejections to Express error
 * handling (via `next(err)`).
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
