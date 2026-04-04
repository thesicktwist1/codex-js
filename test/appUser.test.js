import {describe, expect, it} from 'vitest';

import appUser from '../utils/appUser.js';

describe('appUser', () => {
  it('should map a user object into api payload and use updatedAt when date not provided',
     () => {
       const now = new Date();
       const user = {
         _id: '123',
         email: 'test@example.com',
         username: 'tester',
         createdAt: new Date('2026-01-01T00:00:00.000Z'),
         updatedAt: now,
       };

       const result = appUser(user);

       expect(result).toEqual({
         id: '123',
         email: 'test@example.com',
         username: 'tester',
         createdAt: new Date('2026-01-01T00:00:00.000Z'),
         updatedAt: now,
       });
     });

  it('should override updatedAt when date is provided', () => {
    const user = {
      _id: '123',
      email: 'test@example.com',
      username: 'tester',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    };
    const customDate = new Date('2026-03-01T00:00:00.000Z');
    const result = appUser(user, customDate);

    expect(result.updatedAt).toEqual(customDate);
    expect(result.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });
});
