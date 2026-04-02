import {StatusCodes} from 'http-status-codes';
import {ObjectId} from 'mongodb';

import database from '../db/conn.js';
import databaseObject from '../utils/dbObject.js';
import appError from '../utils/error.js';


// GET /api/books/:id
// Retrieves a single book by ID.
export const getBook = async (req, res, next) => {
  if (!ObjectId.isValid(req.params.bookId)) {
    throw appError('Invalid parameter', StatusCodes.BAD_REQUEST);
  };
  const id = new ObjectId(req.params.bookId);
  let book = await database.collection('books').findOne({_id: id});
  if (!book) {
    throw appError('Not found', StatusCodes.NOT_FOUND);
  };
  res.status(StatusCodes.OK).json(book);
};

// GET /api/books/
// Retrieves books based on the given page & limit
export const getBooks = async (req, res, next) => {
  let limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0 || limit > pageLimit) {
    limit = pageLimit
  };
  let page = parseInt(req.query.page);
  if (isNaN(page)) {
    page = 1
  }
  const skip = (page - 1) * limit;
  const books =
      await database.collection('books').skip(skip).limit(limit).toArray();
  res.status(StatusCodes.OK).json(books);
};

// POST /api/books/
// Create a book
export const createBook = async (req, res, next) => {
  const {title, pageCount, description, author} = req.body;
  let book = await database.collection('books').insertOne(databaseObject({
    title: title,
    pageCount: pageCount,
    chapters: chapters,
    description: description,
    author: author
  }));
  res.status(StatusCodes.CREATED).json(book);
};
