import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import databaseObject from '../utils/dbObject.js';
import validateSchema from '../utils/joiSchemas.js';

/**
 * Reviews controller
 *
 * Handles creation, retrieval, updates, and deletion of reviews. Enforces
 * rating bounds and provides pagination for listing endpoints to keep
 * responses bounded.
 */

const reviewsCollection = database.collection('reviews');
const booksCollection = database.collection('books');

const pageLimit = 10;

/**
 * Validate that `rating` is a number between 1 and 10 (inclusive).
 * @param {number} rating
 * @returns {boolean}
 */
const isValidRating = (rating) => {
  return rating && typeof rating === 'number' && rating >= 1 && rating <= 10;
};
/**
 * POST /api/books/:bookId/reviews
 * Create a review for an existing book. Requires authentication.
 */
export const createReview = asyncHandler(async (req, res) => {
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
/**
 * GET /api/reviews/:id
 * Retrieve a single review by id.
 */
export const getReview = asyncHandler(async (req, res) => {
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

/**
 * GET /api/books/:bookId/reviews
 * List reviews for a book with optional `limit` and `page` queries.
 */
export const getReviewsFromBookId = asyncHandler(async (req, res) => {
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

/**
 * GET /api/user/:userId/reviews
 * List reviews created by a specific user (supports pagination).
 */
export const getReviewsFromUserId = asyncHandler(async (req, res) => {
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
/**
 * GET /api/reviews/
 * List reviews with optional pagination parameters.
 */
export const getReviews = asyncHandler(async (req, res) => {
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

/**
 * PUT /api/reviews/:id
 * Update a review. Requires authentication and enforces rating validation.
 */
export const updateReview = asyncHandler(async (req, res) => {
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

/**
 * DELETE /api/reviews/:id
 * Delete a review owned by the authenticated user.
 */
export const deleteReview = asyncHandler(async (req, res) => {
  if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.user.id)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.id);
  const result = await reviewsCollection.deleteOne(
      {_id: id, userId: new ObjectId(req.user.id)});
  if (result.deletedCount === 0) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.NO_CONTENT).send();
});
