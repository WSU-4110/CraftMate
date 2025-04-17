// __tests__/replyValidation.test.ts

import { validateReplyInput } from '../utils/replyValidation';

describe('validateReplyInput', () => {
  it('returns error if reply is empty', () => {
    const result = validateReplyInput('   ', { uid: 'user123' });
    expect(result.error).toBe("Your reply cannot be empty.");
  });

  it('returns error if user is null', () => {
    const result = validateReplyInput('Hello!', null);
    expect(result.error).toBe("User not found. Please log in again.");
  });

  it('returns error if user has no uid', () => {
    const result = validateReplyInput('Hello!', {});
    expect(result.error).toBe("User not found. Please log in again.");
  });

  it('returns no error if input is valid', () => {
    const result = validateReplyInput('Nice post!', { uid: 'user123' });
    expect(result).toEqual({});
  });
});
