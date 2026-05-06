/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Initiate Razorpay payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string }
 *                 currency: { type: string, example: 'INR' }
 *                 amount: { type: number }
 *                 keyId: { type: string }
 *
 * /payments/verify:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Verify Razorpay payment signature
 *     responses:
 *       200:
 *         description: Payment verified and order confirmed
 */
