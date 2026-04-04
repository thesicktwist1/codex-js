import {describe, expect, it, vi} from 'vitest';

vi.mock(
    'jsonwebtoken', () => ({
                      default: {
                        sign: vi.fn((payload) => `signed-${payload.userId}`),
                      },
                    }));

import generateAccessToken from '../utils/accessToken.js';

describe('generateAccessToken', () => {
  it('should use jwt.sign with configured hostname', () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '60m';

    const token = generateAccessToken({userId: 'abc'});

    expect(token).toBe('signed-abc');
  });
});
