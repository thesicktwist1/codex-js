import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../db/conn.js', () => {
  const booksCollection = {findOne: vi.fn()};
  const reviewsCollection = {
    findOne: vi.fn(),
    find: vi.fn(() => ({
                  skip: vi.fn(() => ({
                                limit: vi.fn(() => ({
                                               toArray: vi.fn(),
                                             })),
                              })),
                })),
    insertOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  };
  const usersCollection = {findOne: vi.fn()};

  return {
    default: {
      collection: vi.fn((name) => {
        if (name === 'books') return booksCollection;
        if (name === 'reviews') return reviewsCollection;
        if (name === 'users') return usersCollection;
        throw new Error(`No collection for ${name}`);
      }),
    },
    __collections: {booksCollection, reviewsCollection, usersCollection},
  };
});

import * as reviewsController from '../controllers/reviewsController.js';
import {__collections} from '../db/conn.js';
import {StatusCodes} from 'http-status-codes';

const makeRes = () => {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
    send: vi.fn(() => res),
  };
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reviewsController', () => {
  it('createReview returns 400 for invalid bookId', async () => {
    const req = {
      params: {bookId: 'x'},
      body: {rating: 5, description: 'ok'},
      user: {id: '1'}
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.createReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('createReview returns 404 when book does not exist', async () => {
    __collections.booksCollection.findOne.mockResolvedValueOnce(null);
    const req = {
      params: {bookId: '60c72b2f4f1a4e24d8b67890'},
      body: {rating: 5, description: 'ok'},
      user: {id: '61c72b2f4f1a4e24d8b67890'}
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.createReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('createReview returns 400 for invalid rating', async () => {
    __collections.booksCollection.findOne.mockResolvedValueOnce({_id: {}});
    const req = {
      params: {bookId: '60c72b2f4f1a4e24d8b67890'},
      body: {rating: 11, description: 'ok'},
      user: {id: '61c72b2f4f1a4e24d8b67890'}
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.createReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('createReview returns 201 with created review', async () => {
    __collections.booksCollection.findOne.mockResolvedValueOnce({_id: {}});
    const insertedId = {toString: () => 'id'};
    __collections.reviewsCollection.insertOne.mockResolvedValueOnce(
        {insertedId});
    const review = {_id: insertedId, rating: 5, description: 'ok'};
    __collections.reviewsCollection.findOne.mockResolvedValueOnce(review);

    const req = {
      params: {bookId: '60c72b2f4f1a4e24d8b67890'},
      body: {rating: 5, description: 'ok'},
      user: {id: '61c72b2f4f1a4e24d8b67890'}
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(res.json).toHaveBeenCalledWith(review);
    expect(next).not.toHaveBeenCalled();
  });

  it('getReview returns 400 when id invalid', async () => {
    const req = {params: {id: 'bad'}};
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('getReview returns 404 when not found', async () => {
    __collections.reviewsCollection.findOne.mockResolvedValueOnce(null);
    const req = {params: {id: '60c72b2f4f1a4e24d8b67890'}};
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('getReviewsFromBookId returns reviews with default pagination', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{rating: 5}, {rating: 4}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.reviewsCollection.find.mockReturnValueOnce(cursor);

    const req = {
      params: {bookId: '60c72b2f4f1a4e24d8b67890'},
      query: {},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReviewsFromBookId(req, res, next);

    expect(__collections.reviewsCollection.find).toHaveBeenCalledWith({
      bookId: expect.any(Object),
    });
    expect(skipFn).toHaveBeenCalledWith(0);
    expect(limitFn).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith([{rating: 5}, {rating: 4}]);
  });

  it('getReviewsFromBookId returns 400 for invalid bookId', async () => {
    const req = {
      params: {bookId: 'invalid'},
      query: {},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReviewsFromBookId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('getReviewsFromUserId returns reviews with pagination', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{rating: 5}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.reviewsCollection.find.mockReturnValueOnce(cursor);

    const req = {
      params: {userId: '60c72b2f4f1a4e24d8b67890'},
      query: {limit: '5', page: '2'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReviewsFromUserId(req, res, next);

    expect(skipFn).toHaveBeenCalledWith(5); // (2 - 1) * 5 = 5
    expect(limitFn).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('getReviews returns 200 with all reviews', async () => {
    const toArray = vi.fn().mockResolvedValueOnce([{rating: 5}, {rating: 4}]);
    const limitFn = vi.fn(() => ({toArray}));
    const skipFn = vi.fn(() => ({limit: limitFn}));
    const cursor = {skip: skipFn};
    __collections.reviewsCollection.find.mockReturnValueOnce(cursor);

    const req = {query: {limit: '10', page: '1'}};
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.getReviews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith([{rating: 5}, {rating: 4}]);
  });

  it('deleteReview returns 400 for invalid review id', async () => {
    const req = {
      params: {id: 'invalid'},
      user: {id: '60c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.deleteReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('deleteReview returns 400 for invalid user id', async () => {
    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      user: {id: 'invalid'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.deleteReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('deleteReview deletes review successfully', async () => {
    __collections.reviewsCollection.deleteOne.mockResolvedValueOnce({
      deletedCount: 1,
    });

    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.deleteReview(req, res, next);

    expect(__collections.reviewsCollection.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deleteReview returns 404 when review not found', async () => {
    __collections.reviewsCollection.deleteOne.mockResolvedValueOnce({
      deletedCount: 0,
    });

    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.deleteReview(req, res, next);

    expect(__collections.reviewsCollection.deleteOne).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('updateReview returns 400 on invalid payload', async () => {
    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {description: 'x'.repeat(501)}, // Too long
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.updateReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('updateReview returns 400 for invalid review id', async () => {
    const req = {
      params: {id: 'invalid'},
      body: {description: 'Updated review', rating: 5},
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.updateReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
  });

  it('updateReview updates review successfully', async () => {
    __collections.reviewsCollection.findOneAndUpdate.mockResolvedValueOnce({
      value: {_id: 'id', rating: 5, description: 'Updated'},
    });

    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {description: 'Updated review', rating: 5},
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.updateReview(req, res, next);

    expect(__collections.reviewsCollection.findOneAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(
        {_id: 'id', rating: 5, description: 'Updated'}
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('updateReview returns 404 when review not found', async () => {
    __collections.reviewsCollection.findOneAndUpdate.mockResolvedValueOnce({
      value: null,
    });

    const req = {
      params: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {description: 'Updated review', rating: 5},
      user: {id: '61c72b2f4f1a4e24d8b67890'},
    };
    const res = makeRes();
    const next = vi.fn();

    await reviewsController.updateReview(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });
});
