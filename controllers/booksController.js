import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import asyncHandler from '../middleware/async.js';
import appError from '../utils/appError.js';
import databaseObject from '../utils/dbObject.js';
import validateSchema from '../utils/joiSchemas.js';

const booksCollection = database.collection('books');
const pageLimit = 10;
// GET /api/books/:id
// Retrieves a single book by ID.
export const getBook = asyncHandler(async (req, res, next) => {
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

// GET /api/books/
// Retrieves books based on the given page & limit
export const getBooks = asyncHandler(async (req, res, next) => {
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

// POST /api/books/
// Create a book
export const createBook = asyncHandler(async (req, res, next) => {
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
