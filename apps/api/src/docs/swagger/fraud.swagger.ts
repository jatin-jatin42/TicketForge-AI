/**
 * @openapi
 * /fraud/check:
 *   post:
 *     tags:
 *       - Fraud
 *     summary: Analyze fraud risk for a transaction
 *     description: Internal service endpoint for risk scoring.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fraud analysis result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FraudScore'
 */
