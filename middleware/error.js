import {StatusCodes} from 'http-status-codes';

const errorHandler = (err, req, res) => {
  const statusCode = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  console.error(`Error ${statusCode}: ${err.message}`);
  res.status(statusCode).json({msg: err.message});
};

export default errorHandler;
