import appError from '../utils/appError.js';

/**
 * 404 handler middleware.
 *
 * Forwards unmatched routes to the error pipeline as a 404 Not Found.
 */
const notFoundHandler = (req, res, next) => {
  next(appError('Not found', 404));
};

export default notFoundHandler;
