import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import databaseObject from '../utils/dbObject.js';
import appError from '../utils/error.js';

export const createReview = async (req, res, next) => {
  const {rating, description} = req.body;
  if (!ObjectId.isValid(req.params.id)) {
    throw appError('Invalid book id', StatusCodes.BAD_REQUEST);
  }
  const bookId = new ObjectId(req.params.id);
  let bookExist = await database.collection('books').findOne({_id: bookId});
  if (!bookExist) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  const userId = new ObjectId(req.user.id);
  let reviewsCollection = database.collection('reviews');
  let review = await reviewsCollection.insertOne(databaseObject({
    userId: userId,
    bookId: bookId,
    rating: rating,
    description: description
  }));
  res.status(StatusCodes.CREATED).json(review);
};

export const getReview = async (req, res, next) => {
  if (!ObjectId.isValid(req.params.bookId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.bookId);
  let review = await database.collection('reviews').findOne({_id: id});
  res.status(StatusCodes.OK).json(review);
};


export const getReviewsFromBookId = async (req, res, next) => {
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
  let review = await database.collection('reviews')
                   .find({bookId: id})
                   .skip(skip)
                   .limit(limit)
                   .toArray();
  res.status(StatusCodes.ACCEPTED).json(review);
};


export const getReviewsFromUserId = async (req, res, next) => {
  if (!ObjectId.isValid(req.params.userId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const id = new ObjectId(req.params.userId);
  const skip = (page - 1) * limit;
  let review = await database.collection('reviews')
                   .find({userId: id})
                   .skip(skip)
                   .limit(limit)
                   .toArray();
  res.status(StatusCodes.ACCEPTED).json(review);
};

export const getReviews = async (req, res, next) => {
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const skip = (page - 1) * limit;
  let review = await database.collection('reviews')
                   .find()
                   .skip(skip)
                   .limit(limit)
                   .toArray();
  res.status(StatusCodes.ACCEPTED).json(review);
};

export const updateReview = async (req, res, next) => {
  if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.user.id)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.id);
  const userId = new ObjectId(req.user.id);
  const {rating, description} = req.body;
  let result = await database.collection('reviews').findOneAndUpdate(
      {_id: id, userId: userId},
      databaseObject({rating: rating, description: description}));
  if (!result) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json(result);
};
