/**
 * @openapi
 * /bookings:
 *   post:
 *     tags:
 *       - Booking
 *     summary: Book tickets for an event
 *     description: |
 *       Reserves seats and creates a pending order.
 *       Note: This endpoint is currently handled via GraphQL mutation `bookTickets`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input or seats not available
 *       409:
 *         description: Idempotency conflict
 *
 * /bookings/{id}:
 *   get:
 *     tags:
 *       - Booking
 *     summary: Get booking details
 *     description: Retrieve order status and ticket details.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       404:
 *         description: Order not found
 *
 * /bookings/user/{userId}:
 *   get:
 *     tags:
 *       - Booking
 *     summary: Get all bookings for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingResponse'
 *
 * /bookings/{id}/cancel:
 *   post:
 *     tags:
 *       - Booking
 *     summary: Cancel a booking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Cannot cancel completed order
 */
