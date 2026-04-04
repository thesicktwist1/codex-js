import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../db/conn.js', () => {
  const usersCollection = {
    findOne: vi.fn(),
    insertOne: vi.fn(),
  };
  const refreshTokenCollection = {
    findOne: vi.fn(),
  };
  const database = {
    collection: vi.fn((name) => {
      if (name === 'users') return usersCollection;
      if (name === 'refreshToken') return refreshTokenCollection;
      throw new Error(`Unexpected collection ${name}`);
    }),
  };
  return {
    default: database,
    __collections: {usersCollection, refreshTokenCollection},
  };
});

vi.mock('bcrypt', () => ({
                    default: {
                      hash: vi.fn(),
                      compare: vi.fn(),
                    },
                  }));

vi.mock(
    'jsonwebtoken',
    () => ({
      default: {
        sign: vi.fn(() => 'test-token'),
        verify: vi.fn((token, secret, callback) => {
          if (callback) {
            callback(null, {userId: 'user-id', session: 'session-id'});
          } else {
            return {userId: 'user-id', session: 'session-id'};
          }
        }),
      },
    }));

vi.mock('../utils/accessToken.js', () => ({
                                     default: vi.fn(() => 'access-token'),
                                   }));

vi.mock('../utils/refreshToken.js', () => ({
                                      generateRefreshToken:
                                          vi.fn(async () => 'refresh-token'),
                                      deleteRefreshToken: vi.fn(async () => {}),
                                    }));

vi.mock('../utils/appUser.js', () => ({
                                 default: (user) => ({
                                   id: user._id,
                                   email: user.email,
                                   username: user.username,
                                   createdAt: user.createdAt,
                                   updatedAt: user.updatedAt,
                                 }),
                               }));

vi.mock('../utils/userAuth.js', () => ({
                                  default: vi.fn(),
                                }));

import * as authController from '../controllers/authController.js';
import {__collections} from '../db/conn.js';
import {StatusCodes} from 'http-status-codes';

const makeRes = () => {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
    send: vi.fn(() => res),
    cookie: vi.fn(() => res),
    clearCookie: vi.fn(() => res),
  };
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authController', () => {
  describe('register', () => {
    it('should return 400 on invalid payload', async () => {
      const req = {body: {email: 'invalid'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
    });

    it('should return 401 when user already exists', async () => {
      __collections.usersCollection.findOne.mockResolvedValueOnce({
        _id: 'existing-id',
        email: 'test@test.com',
      });

      const req = {
        body: {
          email: 'test@test.com',
          username: 'testuser',
          password: 'ValidPass123',
        },
      };
      const res = makeRes();
      const next = vi.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.CONFLICT);
    });

    it('should create new user and return 201', async () => {
      const bcrypt = await import('bcrypt');
      bcrypt.default.hash.mockResolvedValueOnce('hashed-password');

      __collections.usersCollection.findOne.mockResolvedValueOnce(null); // User doesn't exist
      __collections.usersCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'new-user-id',
      });
      __collections.usersCollection.findOne.mockResolvedValueOnce({
        _id: 'new-user-id',
        email: 'new@test.com',
        username: 'testuser12',
        hashedPassword: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        body: {
          email: 'new@test.com',
          username: 'testuser12',
          password: 'ValidPass123',
        },
      };
      const res = makeRes();
      const next = vi.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 on invalid payload', async () => {
      const req = {body: {email: 'invalid'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.BAD_REQUEST);
    });

    it('should authenticate user and return tokens on success', async () => {
      const userAuth = await import('../utils/userAuth.js');
      const user = {
        _id: 'user-id',
        email: 'test@test.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userAuth.default.mockResolvedValueOnce(user);

      const req = {
        body: {email: 'test@test.com', password: 'ValidPass123'},
      };
      const res = makeRes();
      const next = vi.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.cookie)
          .toHaveBeenCalledWith(
              'refreshToken', 'refresh-token',
              expect.objectContaining({httpOnly: true}));
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 'user-id',
          email: 'test@test.com',
        }),
        accessToken: 'access-token',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return 401 when no refresh token', async () => {
      const req = {cookies: {}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when token verification fails', async () => {
      const jwt = await import('jsonwebtoken');
      jwt.default.verify.mockImplementationOnce((token, secret, callback) => {
        callback(new Error('Invalid token'));
      });

      const req = {cookies: {refreshToken: 'invalid-token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when token not found in db', async () => {
      __collections.refreshTokenCollection.findOne.mockResolvedValueOnce(null);

      const req = {cookies: {refreshToken: 'valid-token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when token hash does not match', async () => {
      const bcrypt = await import('bcrypt');
      bcrypt.default.compare.mockResolvedValueOnce(false);

      __collections.refreshTokenCollection.findOne.mockResolvedValueOnce({
        userId: 'user-id',
        session: 'session-id',
        hashedToken: 'hashed',
        expiresAt: new Date(Date.now() + 10000),
      });

      const req = {cookies: {refreshToken: 'valid-token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 when token is expired', async () => {
      const bcrypt = await import('bcrypt');
      bcrypt.default.compare.mockResolvedValueOnce(true);

      __collections.refreshTokenCollection.findOne.mockResolvedValueOnce({
        userId: 'user-id',
        session: 'session-id',
        hashedToken: 'hashed',
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const req = {cookies: {refreshToken: 'valid-token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('should return new access token on valid refresh', async () => {
      const bcrypt = await import('bcrypt');
      bcrypt.default.compare.mockResolvedValueOnce(true);

      __collections.refreshTokenCollection.findOne.mockResolvedValueOnce({
        userId: 'user-id',
        session: 'session-id',
        hashedToken: 'hashed',
        expiresAt: new Date(Date.now() + 10000), // Not expired
      });

      const req = {cookies: {refreshToken: 'valid-token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.refresh(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({accessToken: 'access-token'});
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should clear refresh token cookie when token exists', async () => {
      const deleteRefreshToken = await import('../utils/refreshToken.js');

      const req = {cookies: {refreshToken: 'token'}};
      const res = makeRes();
      const next = vi.fn();

      await authController.revoke(req, res, next);

      expect(deleteRefreshToken.deleteRefreshToken)
          .toHaveBeenCalledWith('token');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear cookie even when no token provided', async () => {
      const req = {cookies: {}};
      const res = makeRes();
      const next = vi.fn();

      await authController.revoke(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
});
