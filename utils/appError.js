/**
 * Create an Error annotated with an HTTP status code.
 *
 * The middleware pipeline uses this to produce consistent JSON error
 * responses.
 */
const appError = (message, statusCode) => {
  const error = new Error(message);
  error.status = statusCode;
  return error;
};

export default appError;
