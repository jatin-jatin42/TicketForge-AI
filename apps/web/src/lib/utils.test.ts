import { cn, formatPrice } from './utils';

describe('Frontend Utils', () => {
    describe('cn utility', () => {
        it('should merge classes correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        it('should handle conditional classes', () => {
            expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
        });

        it('should merge tailwind classes correctly', () => {
            expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
        });
    });

    describe('formatPrice utility', () => {
        it('should format paise into INR rupees string', () => {
            // 1000 paise = ₹10.00
            // Note: Intl.NumberFormat might use different whitespaces or symbols depending on environment
            // We can use a regex or check if it contains the symbol and the value
            const result = formatPrice(1000);
            expect(result).toMatch(/₹10\.00/);
        });

        it('should format large amounts correctly', () => {
            // 100000 paise = ₹1,000.00
            const result = formatPrice(100000);
            expect(result).toMatch(/₹1,000\.00/);
        });

        it('should handle zero', () => {
            const result = formatPrice(0);
            expect(result).toMatch(/₹0\.00/);
        });
    });
});
