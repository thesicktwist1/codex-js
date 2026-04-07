import {StatusCodes} from 'http-status-codes';
import joi from 'joi';

import appError from './appError.js';

// Validation constants shared across Joi schemas to keep constraints
// consistent across routes (registration, updates, and content creation).
const minLength = 8;
const maxLength = 32;
// Maximum description length to avoid excessively large payloads.
const descLength = 500;
// Rating upper bound (1..maxRating).
const maxRating = 10;
// Password policy: at least one lowercase, one uppercase, and one digit.
const passwordPattern = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)');

// Joi validation schemas for request bodies. Use `validateSchema` to apply
// these and convert Joi errors to `appError` instances consumed by the
// middleware stack.
const joiSchemas = {
  // Login: require both email and password to authenticate a user.
  login: joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
  }),
  // Registration: enforce username/password bounds and a basic password
  // complexity policy to improve account security.
  register: joi.object({
    email: joi.string().email().required(),
    username: joi.string().min(minLength).max(maxLength).required(),
    password: joi.string()
                  .min(minLength)
                  .max(maxLength)
                  .pattern(passwordPattern)
                  .required()
  }),
  // Book creation: basic metadata with a limited description size and
  // chapters as an array of strings.
  createBook: joi.object({
    title: joi.string().required(),
    pageCount: joi.number().integer().min(1).required(),
    description: joi.string().max(descLength).required(),
    author: joi.string().required(),
    chapters: joi.array().items(joi.string()).required()
  }),
  // Review creation: limit description length and require an integer
  // rating within the configured bounds.
  createReview: joi.object({
    description: joi.string().max(descLength).required(),
    rating: joi.number().integer().min(1).max(maxRating).required()
  }),
  // Review updates use the same constraints as creation.
  updateReview: joi.object({
    description: joi.string().max(descLength).required(),
    rating: joi.number().integer().min(1).max(maxRating).required()
  }),
  // User update: require current password for verification and ensure the
  // new password follows the same complexity rules as registration.
  updateUser: joi.object({
    currentPassword: joi.string().required(),
    newPassword: joi.string()
                     .min(minLength)
                     .max(maxLength)
                     .pattern(passwordPattern)
                     .required()
  })
};

/**
 * validateSchema(name, body)
 *
 * Validate `body` against the named Joi schema and return an `appError`
 * instance on failure so the middleware stack can convert it to an HTTP
 * response. Returns `undefined` when validation passes.
 */
const validateSchema = (name, body) => {
  const schema = joiSchemas[name];
  if (!schema) {
    return appError('Invalid schema', StatusCodes.INTERNAL_SERVER_ERROR);
  };
  const {error} = schema.validate(body);
  if (error) {
    return appError(error.details[0].message, StatusCodes.BAD_REQUEST);
  };
  return error
};

export default validateSchema;
