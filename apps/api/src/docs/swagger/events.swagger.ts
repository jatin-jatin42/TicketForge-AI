/**
 * @openapi
 * /events:
 *   get:
 *     tags:
 *       - Events
 *     summary: List all active events
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   name: { type: string }
 *                   date: { type: string, format: date-time }
 *                   venue: { type: string }
 *                   minPrice: { type: number }
 *
 * /events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event details and seat layout
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 name: { type: string }
 *                 venue: { type: object }
 *                 sections: { type: array }
 */
