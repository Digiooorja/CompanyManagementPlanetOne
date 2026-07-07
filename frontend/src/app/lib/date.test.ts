import { describe, test, expect } from 'vitest';
import { formatDisplayDate, formatDisplayDateOrDefault, formatDisplayDateOrUnknown } from './date';

describe('formatDisplayDate', () => {
  test('formats a Date object as DD-MM-YYYY', () => {
    // Constructed from local year/month/day components (not a UTC ISO
    // string) so this assertion isn't sensitive to the test runner's
    // timezone - formatDisplayDate reads local getDate()/getMonth().
    expect(formatDisplayDate(new Date(2026, 6, 5))).toBe('05-07-2026');
  });

  test('formats a Date object with single-digit day/month, zero-padded', () => {
    expect(formatDisplayDate(new Date(2026, 0, 9))).toBe('09-01-2026');
  });

  test('returns empty string for null/undefined', () => {
    expect(formatDisplayDate(null)).toBe('');
    expect(formatDisplayDate(undefined)).toBe('');
  });

  test('returns empty string for an invalid date', () => {
    expect(formatDisplayDate('not-a-date')).toBe('');
  });
});

describe('formatDisplayDateOrDefault', () => {
  test('falls back to the default value ("-") when there is no date', () => {
    expect(formatDisplayDateOrDefault(null)).toBe('-');
  });

  test('falls back to a custom default value', () => {
    expect(formatDisplayDateOrDefault(null, 'N/A')).toBe('N/A');
  });

  test('returns the formatted date when present', () => {
    expect(formatDisplayDateOrDefault(new Date(2026, 11, 31))).toBe('31-12-2026');
  });
});

describe('formatDisplayDateOrUnknown', () => {
  test('falls back to "Unknown" when there is no date', () => {
    expect(formatDisplayDateOrUnknown(undefined)).toBe('Unknown');
  });
});
