import { calculateDynamicPrice } from './pricing.service';

describe('Pricing Service - Unit Tests', () => {
    // Helper function to create test data
    const createPricingInput = (overrides = {}) => ({
        basePrice: 1000,
        seatType: 'ORDINARY' as const,
        totalSeats: 100,
        bookedSeats: 0,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        ...overrides,
    });

    describe('Base Price Calculation', () => {
        test('should return base price for ordinary seat with no demand', () => {
            const input = createPricingInput();
            const result = calculateDynamicPrice(input);

            expect(result).toBe(1000);
        });

        test('should apply 1.5x multiplier for premium seats', () => {
            const input = createPricingInput({
                seatType: 'PREMIUM' as const,
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.5 = 1500
            expect(result).toBe(1500);
        });
    });

    describe('Demand-Based Pricing', () => {
        test('should apply 1.2x multiplier when 70-90% seats booked', () => {
            const input = createPricingInput({
                totalSeats: 100,
                bookedSeats: 75, // 75% booked
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.2 = 1200
            expect(result).toBe(1200);
        });

        test('should apply 1.4x multiplier when >90% seats booked', () => {
            const input = createPricingInput({
                totalSeats: 100,
                bookedSeats: 95, // 95% booked
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.4 = 1400
            expect(result).toBe(1400);
        });

        test('should not apply demand multiplier when <70% seats booked', () => {
            const input = createPricingInput({
                totalSeats: 100,
                bookedSeats: 50, // 50% booked
            });
            const result = calculateDynamicPrice(input);

            expect(result).toBe(1000);
        });
    });

    describe('Time-Based Pricing', () => {
        test('should apply 1.25x multiplier when event is within 24 hours', () => {
            const input = createPricingInput({
                eventDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.25 = 1250
            expect(result).toBe(1250);
        });

        test('should not apply time multiplier when event is >24 hours away', () => {
            const input = createPricingInput({
                eventDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
            });
            const result = calculateDynamicPrice(input);

            expect(result).toBe(1000);
        });
    });

    describe('Combined Multipliers', () => {
        test('should apply all multipliers: premium + high demand + last minute', () => {
            const input = createPricingInput({
                seatType: 'PREMIUM' as const,
                totalSeats: 100,
                bookedSeats: 95, // >90% booked
                eventDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.5 (premium) * 1.4 (demand) * 1.25 (time) = 2625
            expect(result).toBe(2625);
        });

        test('should apply premium + medium demand multipliers', () => {
            const input = createPricingInput({
                seatType: 'PREMIUM' as const,
                totalSeats: 100,
                bookedSeats: 80, // 80% booked
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.5 (premium) * 1.2 (demand) = 1800
            expect(result).toBe(1800);
        });
    });

    describe('Edge Cases', () => {
        test('should handle zero base price', () => {
            const input = createPricingInput({
                basePrice: 0,
            });
            const result = calculateDynamicPrice(input);

            expect(result).toBe(0);
        });

        test('should handle 100% seats booked', () => {
            const input = createPricingInput({
                totalSeats: 100,
                bookedSeats: 100,
            });
            const result = calculateDynamicPrice(input);

            // 1000 * 1.4 (>90% booked) = 1400
            expect(result).toBe(1400);
        });

        test('should round to nearest integer', () => {
            const input = createPricingInput({
                basePrice: 999,
                seatType: 'PREMIUM' as const,
            });
            const result = calculateDynamicPrice(input);

            // 999 * 1.5 = 1498.5, should round to 1499
            expect(result).toBe(1499);
        });

        test('should handle very small seat inventory', () => {
            const input = createPricingInput({
                totalSeats: 10,
                bookedSeats: 9, // 90% exactly
            });
            const result = calculateDynamicPrice(input);

            // 9/10 = 0.9 (90%)
            // 0.9 > 0.9 is false (doesn't trigger >90% multiplier)
            // 0.9 >= 0.7 is true (triggers 70-90% multiplier)
            // 1000 * 1.2 = 1200
            expect(result).toBe(1200);
        });
    });

    describe('Real-World Scenarios', () => {
        test('Early bird booking: 7 days before, low demand', () => {
            const input = createPricingInput({
                basePrice: 1500,
                seatType: 'ORDINARY' as const,
                totalSeats: 200,
                bookedSeats: 20, // 10% booked
                eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
            const result = calculateDynamicPrice(input);

            expect(result).toBe(1500); // No multipliers
        });

        test('Last minute premium seat: high demand, <24 hours', () => {
            const input = createPricingInput({
                basePrice: 2000,
                seatType: 'PREMIUM' as const,
                totalSeats: 50,
                bookedSeats: 48, // 96% booked
                eventDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
            });
            const result = calculateDynamicPrice(input);

            // 2000 * 1.5 * 1.4 * 1.25 = 5250
            expect(result).toBe(5250);
        });
    });
});
