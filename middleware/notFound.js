import appError from '../utils/appError.js';

const notFoundHandler = (req, res, next) => {
  next(appError('Not found', 404));
};

export default notFoundHandler;
