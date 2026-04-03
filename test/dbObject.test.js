import {describe, expect, it} from 'vitest';

import databaseObject from '../utils/dbObject.js';

describe('databaseObject', () => {
  it('should add updatedAt when created is false', () => {
    const base = {title: 'Test'};
    const result = databaseObject(base, false);

    expect(result).toMatchObject({title: 'Test'});
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('createdAt');
  });

  it('should add createdAt and updatedAt when created is true', () => {
    const base = {title: 'Test'};
    const result = databaseObject(base, true);

    expect(result).toMatchObject({title: 'Test'});
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime());
  });
});
