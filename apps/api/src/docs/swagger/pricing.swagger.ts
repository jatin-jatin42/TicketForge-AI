/**
 * @openapi
 * /pricing/calculate:
 *   post:
 *     tags:
 *       - Pricing
 *     summary: Calculate dynamic price
 *     description: |
 *       Returns the calculated price based on demand, time remaining, and seat type.
 *       Powered by TensorFlow.js demand model.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               seatId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Price calculation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingResponse'
 * 
 * /pricing/demand/{eventId}:
 *   get:
 *     tags:
 *       - Pricing
 *     summary: Get real-time demand metrics
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Demand metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 demandLevel: 
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH]
 *                 multiplier:
 *                   type: number
 *                   example: 1.2
 */
