import {describe, expect, it} from 'vitest';

import appError from '../utils/appError.js';

describe('appError', () => {
  it('should create an Error with a message and status code', () => {
    const err = appError('Not found', 404);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
  });

  it('should preserve stack trace information', () => {
    const err = appError('Unauthorized', 401);
    expect(err.stack).toBeTruthy();
    expect(err.stack).toContain('appError');
  });
});
