import { formatTimestamp } from '../utils/formatUtils';

describe('formatTimestamp', () => {
  it('returns "No date" for null or undefined', () => {
    expect(formatTimestamp(null)).toBe("No date");
    expect(formatTimestamp(undefined)).toBe("No date");
  });

  it('handles Firestore Timestamp object with toDate method', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-03-01'),
    };

    expect(formatTimestamp(mockTimestamp)).toBe(new Date('2024-03-01').toLocaleDateString());
  });

  it('formats ISO date strings', () => {
    expect(formatTimestamp('2024-05-01T12:00:00Z')).toBe(new Date('2024-05-01T12:00:00Z').toLocaleDateString());
  });

  it('returns "No date" for invalid date strings', () => {
    expect(formatTimestamp('not-a-date')).toBe("No date");
  });

  it('formats numeric timestamps', () => {
    const timestamp = Date.now();
    expect(formatTimestamp(timestamp)).toBe(new Date(timestamp).toLocaleDateString());
  });
});

