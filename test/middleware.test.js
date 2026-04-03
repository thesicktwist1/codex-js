import {describe, expect, it, vi} from 'vitest';

import asyncHandler from '../middleware/async.js';
import authHandler from '../middleware/auth.js';
import errorHandler from '../middleware/error.js';
import notFoundHandler from '../middleware/notFound.js';
import appError from '../utils/appError.js';

vi.mock('jsonwebtoken', () => ({
                          default: {
                            verify: vi.fn((token, secret) => ({userId: 'x'})),
                          },
                        }));

describe('middleware', () => {
  it('asyncHandler should pass thrown errors to next', async () => {
    const next = vi.fn();
    const errFn = asyncHandler(async () => {
      throw new Error('boom');
    });

    await errFn({}, {}, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('asyncHandler should call pass when no error', async () => {
    const next = vi.fn();
    const fn = asyncHandler(async () => 'ok');

    await fn({}, {}, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('errorHandler should set status and json', () => {
    const res = {status: vi.fn(() => res), json: vi.fn()};
    const err = appError('fail', 418);

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({msg: 'fail'});
  });

  it('notFoundHandler should call next with appError(404)', () => {
    const next = vi.fn();

    notFoundHandler({}, {}, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(404);
    expect(next.mock.calls[0][0].message).toBe('Not found');
  });

  it('authHandler should call next and set req.user on valid token', () => {
    const next = vi.fn();
    const req = {headers: {authorization: 'Bearer valid-token'}};
    const res = {};

    authHandler(req, res, next);

    expect(req.user).toEqual({id: 'x'});
    expect(next).toHaveBeenCalledWith();
  });

  it('authHandler should fail on missing header', () => {
    const next = vi.fn();
    const req = {headers: {}};

    authHandler(req, {}, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.message).toContain('No authorization token included');
  });
});
