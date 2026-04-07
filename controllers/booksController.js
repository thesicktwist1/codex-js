import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import databaseObject from '../utils/dbObject.js';
import validateSchema from '../utils/joiSchemas.js';

/**
 * Books controller
 *
 * Handlers to list, retrieve, and create books. Enforces pagination and
 * request validation to keep responses predictable and protect resources.
 */
const booksCollection = database.collection('books');
const pageLimit = 10;
/**
 * GET /api/books/:bookId
 * Retrieve a single book by id. Validates the `bookId` parameter.
 */
export const getBook = asyncHandler(async (req, res) => {
  if (!ObjectId.isValid(req.params.bookId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.bookId);
  let book = await booksCollection.findOne({_id: id});
  if (!book) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json(book);
});

/**
 * GET /api/books/
 * List books with optional `limit` and `page` query parameters.
 */
export const getBooks = asyncHandler(async (req, res) => {
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit;
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1;
  };
  const skip = (page - 1) * limit;
  const books = await booksCollection.find().skip(skip).limit(limit).toArray();
  res.status(StatusCodes.OK).json(books);
});

/**
 * POST /api/books/
 * Create a new book after validating the request body.
 */
export const createBook = asyncHandler(async (req, res) => {
  const error = validateSchema('createBook', req.body);
  if (error) {
    throw error;
  };
  const {title, pageCount, description, author, chapters} = req.body;
  const result = await booksCollection.insertOne(databaseObject(
      {
        title: title,
        pageCount: pageCount,
        chapters: chapters,
        description: description,
        author: author
      },
      true));
  const book = await booksCollection.findOne({_id: result.insertedId});
  res.status(StatusCodes.CREATED).json(book);
});
