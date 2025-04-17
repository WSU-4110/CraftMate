import { formatReplyDate } from '../utils.dateUtils';

describe('formatReplyDate', () => {
  it('formats a valid date correctly', () => {
    const date = new Date(2023, 2, 9); // March 9, 2023 (month is 0-indexed)
    expect(formatReplyDate(date)).toBe('03/09/2023');
  });

  it('pads single-digit month and day with zero', () => {
    const date = new Date(2023, 0, 5); // January 5, 2023
    expect(formatReplyDate(date)).toBe('01/05/2023');
  });
});
