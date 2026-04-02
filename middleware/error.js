import {StatusCodes} from 'http-status-codes';

const errorHandler = (err, req, res, next) => {
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    msg: err.message
  });
};

export default errorHandler;
