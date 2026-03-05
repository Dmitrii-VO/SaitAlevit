import { formatPrice, formatPhone, getWorkStatusBadge } from '../src/js/utils/format';

describe('Format Utils', () => {
  describe('formatPrice', () => {
    test('should format number with spaces', () => {
      expect(formatPrice(1000000)).toBe('1\u00A0000\u00A0000'); // Non-breaking space
    });

    test('should round decimal numbers', () => {
      expect(formatPrice(12345.67)).toBe('12\u00A0346');
    });
  });

  describe('formatPhone', () => {
    test('should format 11 digit number starting with 7', () => {
      expect(formatPhone('79001234567')).toBe('+7 (900) 123-45-67');
    });

    test('should format 11 digit number starting with 8', () => {
      expect(formatPhone('89001234567')).toBe('+7 (900) 123-45-67');
    });

    test('should return input if number is too short', () => {
      expect(formatPhone('123')).toBe('+7 (123'); // logic in function adds open parenthesis for mask
    });
  });

  describe('getWorkStatusBadge', () => {
    test('should return "Построен" for finished status', () => {
      expect(getWorkStatusBadge('построен', '01.2023')).toBe('Построен • 01.2023');
    });

    test('should return "Строится" for active status', () => {
      expect(getWorkStatusBadge('строит')).toBe('Строится');
    });

    test('should return original status if unknown', () => {
      expect(getWorkStatusBadge('unknown')).toBe('unknown');
    });
  });
});
