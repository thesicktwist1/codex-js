// Create an error with a status code and message
const appError = (message, statusCode) => {
  const error = new Error(message);
  error.status = statusCode;
  return error;
};

export default appError;
