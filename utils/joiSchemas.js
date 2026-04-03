import {StatusCodes} from 'http-status-codes';
import joi from 'joi';

import {updateUser} from '../controllers/userController.js';

import appError from './appError.js';

const minLength = 8;
const maxLength = 32;
const descLength = 500;
const maxRating = 10;
const passwordPattern = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)');

const joiSchemas = {
  login: joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
  }),
  register: joi.object({
    email: joi.string().email().required(),
    username: joi.string().min(minLength).max(maxLength).required(),
    password: joi.string()
                  .min(minLength)
                  .max(maxLength)
                  .pattern(passwordPattern)
                  .required()
  }),
  createBook: joi.object({
    title: joi.string().required(),
    pageCount: joi.number().integer().min(1).required(),
    description: joi.string().max(descLength).required(),
    author: joi.string().required(),
    chapters: joi.array().items(joi.string()).required()
  }),
  createReview: joi.object({
    description: joi.string().max(descLength).required(),
    rating: joi.number().integer().min(1).max(maxRating).required()
  }),
  updateReview: joi.object({
    description: joi.string().max(descLength).required(),
    rating: joi.number().integer().min(1).max(maxRating).required()
  }),
  updateUser: joi.object({
    currentPassword: joi.string().required(),
    newPassword: joi.string()
                     .min(minLength)
                     .max(maxLength)
                     .pattern(passwordPattern)
                     .required()
  })
};

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
