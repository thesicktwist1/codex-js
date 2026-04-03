import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../db/conn.js', () => {
  const booksCollection = {
    findOne: vi.fn(),
    find: vi.fn(
        () => (
            {skip: vi.fn(() => ({limit: vi.fn(() => ({toArray: vi.fn()}))}))})),
    insertOne: vi.fn(),
  };
  const usersCollection = {findOne: vi.fn()};
  const database = {
    collection: vi.fn((name) => {
      if (name === 'books') return booksCollection;
      if (name === 'users') return usersCollection;
      throw new Error(`Unexpected collection ${name}`);
    }),
  };
  return {
    default: database,
    __collections: {booksCollection, usersCollection},
  };
});

import * as booksController from '../controllers/booksController.js';
import database, {__collections} from '../db/conn.js';
import {StatusCodes} from 'http-status-codes';

const makeRes = () => {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('booksController', () => {
  it('getBook returns 400 for invalid id', async () => {
    const req = {params: {bookId: 'invalid'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBook(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('getBook returns 404 when book not found', async () => {
    __collections.booksCollection.findOne.mockResolvedValueOnce(null);
    const req = {params: {bookId: '60c72b2f4f1a4e24d8b67890'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBook(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('getBook returns 200 and book data', async () => {
    const book = {title: 'A Book'};
    __collections.booksCollection.findOne.mockResolvedValueOnce(book);
    const req = {params: {bookId: '60c72b2f4f1a4e24d8b67890'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(book);
    expect(next).not.toHaveBeenCalled();
  });

  it('getBooks returns 200 and list with paging', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{title: 'A'}, {title: 'B'}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.booksCollection.find.mockReturnValueOnce(cursor);

    const req = {query: {limit: '2', page: '1'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBooks(req, res, next);

    expect(__collections.booksCollection.find).toHaveBeenCalled();
    expect(skipFn).toHaveBeenCalledWith(0);
    expect(limitFn).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith([{title: 'A'}, {title: 'B'}]);
    expect(next).not.toHaveBeenCalled();
  });

  it('createBook returns 400 on invalid payload', async () => {
    const req = {body: {title: 'x'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.createBook(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('createBook inserts and return created book', async () => {
    const insertedId = {toString: () => 'id'};
    __collections.booksCollection.insertOne.mockResolvedValueOnce({insertedId});
    const createdBook = {title: 'New Book', _id: insertedId};
    __collections.booksCollection.findOne.mockResolvedValueOnce(createdBook);

    const req = {
      body: {
        title: 'New Book',
        pageCount: 100,
        description: 'Desc',
        author: 'Author',
        chapters: ['c1'],
      },
    };
    const res = makeRes();
    const next = vi.fn();

    await booksController.createBook(req, res, next);

    expect(__collections.booksCollection.insertOne).toHaveBeenCalled();
    expect(__collections.booksCollection.findOne).toHaveBeenCalledWith({
      _id: insertedId
    });
    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(res.json).toHaveBeenCalledWith(createdBook);
    expect(next).not.toHaveBeenCalled();
  });

  it('getBooks uses default limit when invalid', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{title: 'A'}, {title: 'B'}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.booksCollection.find.mockReturnValueOnce(cursor);

    const req = {query: {limit: '999', page: '1'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBooks(req, res, next);

    expect(skipFn).toHaveBeenCalledWith(0);
    expect(limitFn).toHaveBeenCalledWith(10); // Default limit
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('getBooks uses default page when invalid', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{title: 'A'}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.booksCollection.find.mockReturnValueOnce(cursor);

    const req = {query: {limit: '5', page: 'invalid'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBooks(req, res, next);

    expect(skipFn).toHaveBeenCalledWith(0); // (1 - 1) * 5 = 0
    expect(limitFn).toHaveBeenCalledWith(5);
  });

  it('getBooks paginates correctly', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{title: 'C'}, {title: 'D'}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.booksCollection.find.mockReturnValueOnce(cursor);

    const req = {query: {limit: '2', page: '3'}};
    const res = makeRes();
    const next = vi.fn();

    await booksController.getBooks(req, res, next);

    expect(skipFn).toHaveBeenCalledWith(4); // (3 - 1) * 2 = 4
    expect(limitFn).toHaveBeenCalledWith(2);
  });
});
