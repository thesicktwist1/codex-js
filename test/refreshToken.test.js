import {describe, expect, it, vi} from 'vitest';

process.env.REFRESH_SECRET = 'refresh-secret';
process.env.REFRESH_EXPIRATION_DAYS = '1';

vi.mock('../db/conn.js', () => {
  const insertOne = vi.fn();
  const deleteOne = vi.fn();
  const collection = vi.fn(() => ({insertOne, deleteOne}));
  const database = {collection};
  return {default: database};
});

vi.mock('bcrypt', () => ({default: {hash: vi.fn(async () => 'hashed-token')}}));
vi.mock(
    'jsonwebtoken',
    () => ({
      default: {
        sign: vi.fn(() => 'refresh-token'),
        verify: vi.fn(() => ({userId: 'userId', session: 'sessionId'})),
      },
    }));

import {generateRefreshToken, deleteRefreshToken} from '../utils/refreshToken.js';

describe('refreshToken utils', () => {
  it('generateRefreshToken should return token and call sign/hash',
     async () => {
       const token = await generateRefreshToken('userId');

       expect(token).toBe('refresh-token');

       const bcrypt = await import('bcrypt');
       const jwt = await import('jsonwebtoken');

       expect(jwt.default.sign).toHaveBeenCalled();
       expect(bcrypt.default.hash).toHaveBeenCalled();
     });

  it('deleteRefreshToken should resolve and verify token', async () => {
    await expect(deleteRefreshToken('refresh-token')).resolves.not.toThrow();

    const jwt = await import('jsonwebtoken');
    expect(jwt.default.verify).toHaveBeenCalledWith('refresh-token', undefined);
  });
});
