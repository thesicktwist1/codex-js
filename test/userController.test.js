import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../db/conn.js', () => {
  const usersCollection = {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
    updateOne: vi.fn(),
  };
  const refreshTokenCollection = {deleteMany: vi.fn()};

  return {
    default: {
      collection: vi.fn((name) => {
        if (name === 'users') return usersCollection;
        if (name === 'refreshToken') return refreshTokenCollection;
        throw new Error(`Unexpected collection ${name}`);
      }),
    },
    __collections: {usersCollection, refreshTokenCollection},
  };
});

vi.mock('bcrypt', () => ({
                    default: {
                      compare: vi.fn(),
                      hash: vi.fn(),
                    },
                  }));

import * as userController from '../controllers/userController.js';
import database, {__collections} from '../db/conn.js';
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

describe('userController', () => {
  it('getUser returns 404 when no user', async () => {
    __collections.usersCollection.findOne.mockResolvedValueOnce(null);
    const req = {user: {id: '60c72b2f4f1a4e24d8b67890'}};
    const res = makeRes();
    const next = vi.fn();

    await userController.getUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('getUser returns user when found', async () => {
    const user = {
      _id: 'id',
      email: 'a@a.com',
      username: 'a',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    __collections.usersCollection.findOne.mockResolvedValueOnce(user);
    const req = {user: {id: '60c72b2f4f1a4e24d8b67890'}};
    const res = makeRes();
    const next = vi.fn();

    await userController.getUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(
        {user: expect.objectContaining({id: 'id', email: 'a@a.com'})});
    expect(next).not.toHaveBeenCalled();
  });

  it('deleteUser returns 404 when no user', async () => {
    __collections.usersCollection.findOne.mockResolvedValueOnce(null);
    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {password: 'pass'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.deleteUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.NOT_FOUND);
  });

  it('deleteUser returns 401 on bad password', async () => {
    __collections.usersCollection.findOne.mockResolvedValueOnce(
        {_id: 'id', hashedPassword: 'hash'});
    const bcrypt = await import('bcrypt');
    bcrypt.default.compare.mockResolvedValueOnce(false);

    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {password: 'wrong'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.deleteUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('deleteUser works with valid password', async () => {
    __collections.usersCollection.findOne.mockResolvedValueOnce(
        {_id: 'id', hashedPassword: 'hash'});
    const bcrypt = await import('bcrypt');
    bcrypt.default.compare.mockResolvedValueOnce(true);

    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {password: 'right'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.deleteUser(req, res, next);

    expect(__collections.usersCollection.deleteOne).toHaveBeenCalled();
    expect(__collections.refreshTokenCollection.deleteMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('updateUser returns 400 on invalid newPassword', async () => {
    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {currentPassword: 'x', newPassword: 'abc'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.updateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('updateUser returns 401 on incorrect current password', async () => {
    __collections.usersCollection.findOne.mockResolvedValueOnce(
        {_id: 'id', hashedPassword: 'hash'});
    const bcrypt = await import('bcrypt');
    bcrypt.default.compare.mockResolvedValueOnce(false);

    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {currentPassword: 'wrong', newPassword: 'Valid1234'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('updateUser updates password for valid request', async () => {
    const existingUser = {
      _id: 'id',
      hashedPassword: 'hash',
      email: 'a@a.com',
      username: 'a',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    __collections.usersCollection.findOne.mockResolvedValueOnce(existingUser);
    const bcrypt = await import('bcrypt');
    bcrypt.default.compare.mockResolvedValueOnce(true);
    bcrypt.default.hash.mockResolvedValueOnce('newhash');
    __collections.usersCollection.updateOne.mockResolvedValueOnce({});
    __collections.usersCollection.findOne.mockResolvedValueOnce(
        {...existingUser, hashedPassword: 'newhash'});

    const req = {
      user: {id: '60c72b2f4f1a4e24d8b67890'},
      body: {currentPassword: 'right', newPassword: 'Valid1234'}
    };
    const res = makeRes();
    const next = vi.fn();

    await userController.updateUser(req, res, next);

    expect(__collections.usersCollection.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(
        {user: expect.objectContaining({id: 'id', email: 'a@a.com'})});
    expect(next).not.toHaveBeenCalled();
  });
});
