import {StatusCodes} from 'http-status-codes';

/**
 * Generic Express error middleware.
 *
 * Logs the error server-side and sends a minimal JSON response using
 * `err.status` when available, otherwise returns HTTP 500.
 */
const errorHandler = (err, req, res) => {
  const statusCode = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  console.error(`Error ${statusCode}: ${err.message}`);
  res.status(statusCode).json({msg: err.message});
};

export default errorHandler;
