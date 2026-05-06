/**
 * Utility Functions Tests
 * 
 * Tests for common utility functions used across the application
 */

describe('String Utilities', () => {
    describe('formatPrice', () => {
        // Helper function to format price in INR
        const formatPrice = (amount: number): string => {
            return `₹${amount.toLocaleString('en-IN')}`;
        };

        test('should format whole numbers correctly', () => {
            expect(formatPrice(1000)).toBe('₹1,000');
            expect(formatPrice(10000)).toBe('₹10,000');
            expect(formatPrice(100000)).toBe('₹1,00,000');
        });

        test('should format decimal numbers correctly', () => {
            expect(formatPrice(1078.86)).toBe('₹1,078.86');
            expect(formatPrice(99.99)).toBe('₹99.99');
        });

        test('should handle zero', () => {
            expect(formatPrice(0)).toBe('₹0');
        });

        test('should handle large numbers', () => {
            expect(formatPrice(1000000)).toBe('₹10,00,000');
            expect(formatPrice(10000000)).toBe('₹1,00,00,000');
        });
    });

    describe('formatDate', () => {
        // Helper function to format date
        const formatDate = (date: Date): string => {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        };

        test('should format date correctly', () => {
            const date = new Date('2026-12-31');
            const formatted = formatDate(date);

            expect(formatted).toContain('2026');
            expect(formatted).toContain('Dec');
            expect(formatted).toContain('31');
        });

        test('should handle different months', () => {
            const jan = new Date('2026-01-15');
            const jun = new Date('2026-06-20');

            expect(formatDate(jan)).toContain('Jan');
            expect(formatDate(jun)).toContain('Jun');
        });
    });

    describe('generateId', () => {
        // Helper function to generate unique ID
        const generateId = (): string => {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        };

        test('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
        });

        test('should generate non-empty strings', () => {
            const id = generateId();

            expect(id).toBeDefined();
            expect(id.length).toBeGreaterThan(0);
        });
    });
});

describe('Validation Utilities', () => {
    describe('isValidEmail', () => {
        const isValidEmail = (email: string): boolean => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        test('should validate correct email addresses', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.in')).toBe(true);
            expect(isValidEmail('admin+tag@company.org')).toBe(true);
        });

        test('should reject invalid email addresses', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('no@domain')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        const isValidPhone = (phone: string): boolean => {
            // Indian phone number: 10 digits
            const phoneRegex = /^[6-9]\d{9}$/;
            return phoneRegex.test(phone);
        };

        test('should validate correct Indian phone numbers', () => {
            expect(isValidPhone('9876543210')).toBe(true);
            expect(isValidPhone('8123456789')).toBe(true);
            expect(isValidPhone('7000000000')).toBe(true);
            expect(isValidPhone('6999999999')).toBe(true);
        });

        test('should reject invalid phone numbers', () => {
            expect(isValidPhone('123456789')).toBe(false); // Too short
            expect(isValidPhone('12345678901')).toBe(false); // Too long
            expect(isValidPhone('5123456789')).toBe(false); // Starts with 5
            expect(isValidPhone('abcdefghij')).toBe(false); // Letters
            expect(isValidPhone('')).toBe(false); // Empty
        });
    });

    describe('isValidPrice', () => {
        const isValidPrice = (price: number): boolean => {
            return price >= 0 && Number.isFinite(price);
        };

        test('should validate positive prices', () => {
            expect(isValidPrice(100)).toBe(true);
            expect(isValidPrice(1078.86)).toBe(true);
            expect(isValidPrice(0)).toBe(true);
        });

        test('should reject invalid prices', () => {
            expect(isValidPrice(-100)).toBe(false);
            expect(isValidPrice(Infinity)).toBe(false);
            expect(isValidPrice(NaN)).toBe(false);
        });
    });
});

describe('Array Utilities', () => {
    describe('chunk', () => {
        // Helper to split array into chunks
        const chunk = <T>(array: T[], size: number): T[][] => {
            const chunks: T[][] = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        };

        test('should split array into chunks', () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const result = chunk(arr, 3);

            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        });

        test('should handle uneven chunks', () => {
            const arr = [1, 2, 3, 4, 5];
            const result = chunk(arr, 2);

            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });

        test('should handle empty array', () => {
            const result = chunk([], 3);
            expect(result).toEqual([]);
        });

        test('should handle chunk size larger than array', () => {
            const arr = [1, 2, 3];
            const result = chunk(arr, 10);

            expect(result).toEqual([[1, 2, 3]]);
        });
    });

    describe('unique', () => {
        const unique = <T>(array: T[]): T[] => {
            return [...new Set(array)];
        };

        test('should remove duplicates', () => {
            expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
            expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
        });

        test('should handle array with no duplicates', () => {
            expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
        });

        test('should handle empty array', () => {
            expect(unique([])).toEqual([]);
        });
    });
});

describe('Object Utilities', () => {
    describe('pick', () => {
        const pick = <T extends object, K extends keyof T>(
            obj: T,
            keys: K[]
        ): Pick<T, K> => {
            const result = {} as Pick<T, K>;
            keys.forEach(key => {
                if (key in obj) {
                    result[key] = obj[key];
                }
            });
            return result;
        };

        test('should pick specified keys from object', () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = pick(obj, ['a', 'c']);

            expect(result).toEqual({ a: 1, c: 3 });
        });

        test('should handle empty keys array', () => {
            const obj = { a: 1, b: 2 };
            const result = pick(obj, []);

            expect(result).toEqual({});
        });
    });

    describe('omit', () => {
        const omit = <T extends object, K extends keyof T>(
            obj: T,
            keys: K[]
        ): Omit<T, K> => {
            const result = { ...obj };
            keys.forEach(key => {
                delete result[key];
            });
            return result;
        };

        test('should omit specified keys from object', () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = omit(obj, ['b', 'd']);

            expect(result).toEqual({ a: 1, c: 3 });
        });

        test('should handle empty keys array', () => {
            const obj = { a: 1, b: 2 };
            const result = omit(obj, []);

            expect(result).toEqual({ a: 1, b: 2 });
        });
    });
});

describe('Time Utilities', () => {
    describe('getHoursUntil', () => {
        const getHoursUntil = (futureDate: Date): number => {
            return (futureDate.getTime() - Date.now()) / (1000 * 60 * 60);
        };

        test('should calculate hours until future date', () => {
            const future = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            const hours = getHoursUntil(future);

            expect(hours).toBeGreaterThan(23);
            expect(hours).toBeLessThan(25);
        });

        test('should return negative for past dates', () => {
            const past = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
            const hours = getHoursUntil(past);

            expect(hours).toBeLessThan(0);
        });
    });

    describe('isEventSoon', () => {
        const isEventSoon = (eventDate: Date, hoursThreshold: number = 24): boolean => {
            const hoursUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
            return hoursUntil > 0 && hoursUntil < hoursThreshold;
        };

        test('should return true for events within threshold', () => {
            const soon = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
            expect(isEventSoon(soon, 24)).toBe(true);
        });

        test('should return false for events beyond threshold', () => {
            const later = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
            expect(isEventSoon(later, 24)).toBe(false);
        });

        test('should return false for past events', () => {
            const past = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
            expect(isEventSoon(past, 24)).toBe(false);
        });
    });
});

/**
 * TO RUN THESE TESTS:
 * 
 * cd apps/api
 * pnpm test utils.test.ts
 * 
 * These tests cover common utility functions:
 * - String formatting (price, date)
 * - Validation (email, phone, price)
 * - Array operations (chunk, unique)
 * - Object operations (pick, omit)
 * - Time calculations
 */
