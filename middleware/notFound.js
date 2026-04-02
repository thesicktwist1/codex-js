import appError from '../utils/error.js';

const notFoundHandler = (res, req, next) => {
  throw appError('Not found', 404)
};

export default notFoundHandler;
