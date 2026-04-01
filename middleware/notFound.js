const notFoundHandler = (res, req, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(err);
};

export default notFoundHandler;
