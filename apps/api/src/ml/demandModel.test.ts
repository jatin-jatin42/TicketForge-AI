import { initDemandModel, predictMultiplierByDemand } from "./demandModel";

describe('Demand Model ML', () => {
    beforeAll(async () => {
        await initDemandModel();
    }, 60000);

    test('should return higher multiplier for higher demand', () => {
        const lowDemand = 5;
        const highDemand = 90;

        const lowMultiplier = predictMultiplierByDemand(lowDemand);
        const highMultiplier = predictMultiplierByDemand(highDemand);

        // High demand should generally result in a higher multiplier
        // Since it's a trained model, we check for relative difference or range
        expect(highMultiplier).toBeGreaterThanOrEqual(lowMultiplier);
    });

    test('should return multipliers within a reasonable range', () => {
        const demandSamples = [0, 20, 50, 80, 100];

        for (const demand of demandSamples) {
            const multiplier = predictMultiplierByDemand(demand);

            // Multiplier should be positive and reasonable (e.g., 0.5 to 5.0)
            expect(multiplier).toBeGreaterThan(0.1);
            expect(multiplier).toBeLessThan(10.0);
        }
    });

    test('should be deterministic for the same input', () => {
        const demand = 50;
        const firstCall = predictMultiplierByDemand(demand);
        const secondCall = predictMultiplierByDemand(demand);

        expect(firstCall).toBe(secondCall);
    });
});
