import {StatusCodes} from 'http-status-codes';
import joi from 'joi';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import databaseObject from '../utils/dbObject.js';
import validateSchema from '../utils/joiSchemas.js';

const reviewsCollection = database.collection('reviews');
const booksCollection = database.collection('books');

const pageLimit = 10;

const isValidRating = (rating) => {
  return rating && typeof rating === 'number' && rating >= 1 && rating <= 10;
};

// POST /api/review
// Creates a review based on the given book id
export const createReview = asyncHandler(async (req, res, next) => {
  const error = validateSchema('createReview', req.body);
  if (error) {
    throw error;
  };
  if (!ObjectId.isValid(req.params.bookId)) {
    throw appError('Invalid book id', StatusCodes.BAD_REQUEST);
  };
  const bookId = new ObjectId(req.params.bookId);
  let bookExist = await booksCollection.findOne({_id: bookId});
  if (!bookExist) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  const {rating, description} = req.body;
  let insertResult = await reviewsCollection.insertOne(databaseObject({
    userId: new ObjectId(req.user.id),
    bookId: bookId,
    rating: rating,
    description: description
  }));
  const review =
      await reviewsCollection.findOne({_id: insertResult.insertedId});
  res.status(StatusCodes.CREATED).json(review);
});
// GET /api/review/:id
// Get a single review based on id
export const getReview = asyncHandler(async (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.id);
  let review = await reviewsCollection.findOne({_id: id});
  if (!review) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json(review);
});

// GET /api/books/:bookId/reviews
// Get multiple reviews based on the given book id
// Queries: [limit, page]
export const getReviewsFromBookId = asyncHandler(async (req, res, next) => {
  if (!ObjectId.isValid(req.params.bookId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit;
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const skip = (page - 1) * limit;
  const id = new ObjectId(req.params.bookId);
  let reviews = await reviewsCollection.find({bookId: id})
                    .skip(skip)
                    .limit(limit)
                    .toArray();
  res.status(StatusCodes.OK).json(reviews);
});

// GET /api/user/:userId/reviews
// Get multiple reviews based on the given book id
// Queries: [limit, page]
export const getReviewsFromUserId = asyncHandler(async (req, res, next) => {
  if (!ObjectId.isValid(req.params.userId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit;
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const id = new ObjectId(req.params.userId);
  const skip = (page - 1) * limit;
  let reviews = await reviewsCollection.find({userId: id})
                    .skip(skip)
                    .limit(limit)
                    .toArray();
  res.status(StatusCodes.OK).json(reviews);
});
// GET /api/reviews/
// Get multiple reviews
// Queries: [limit, page]
export const getReviews = asyncHandler(async (req, res, next) => {
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit;
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const skip = (page - 1) * limit;
  let reviews =
      await reviewsCollection.find().skip(skip).limit(limit).toArray();
  res.status(StatusCodes.OK).json(reviews);
});

// PUT /api/reviews/:id
// Update a review based on given id
// Require: Access Token
export const updateReview = asyncHandler(async (req, res, next) => {
  const error = validateSchema('updateReview', req.body);
  if (error) {
    throw error;
  };
  if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.user.id)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.id);
  const {rating, description} = req.body;
  if (!isValidRating(rating)) {
    throw appError('Invalid rating field', StatusCodes.BAD_REQUEST);
  };
  let result = await reviewsCollection.findOneAndUpdate(
      {_id: id, userId: new ObjectId(req.user.id)},
      {$set: databaseObject({rating: rating, description: description})},
      {returnDocument: 'after'});
  if (!result || !result.value) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json(result.value);
});

// DELETE /api/reviews/:id
// Delete a review based on given id
// Require: Access Token
export const deleteReview = asyncHandler(async (req, res, next) => {
  if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.user.id)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.id);
  await reviewsCollection.deleteOne(
      {_id: id, userId: new ObjectId(req.user.id)});
  res.status(StatusCodes.NO_CONTENT).send();
});
