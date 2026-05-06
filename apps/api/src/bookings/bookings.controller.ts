import { Request, Response } from 'express';
import { bookingService } from './bookings.service';
import { GraphQLError } from 'graphql';

/**
 * REST Controller shim for BookingService
 * Allows Swagger UI to interact with core logic.
 */

export const createBooking = async (req: Request, res: Response) => {
    try {
        const { eventId, seatIds, idempotencyKey, userId: bodyUserId } = req.body;

        // Prefer authenticated user, fall back to body (for testing/admin), or fail
        const userId = req.user?.id || bodyUserId;

        if (!userId) {
            res.status(401).json({ error: 'User ID is required. Please provide Auth token or userId in body.' });
            return;
        }

        const result = await bookingService.bookTickets(
            userId,
            eventId,
            seatIds,
            idempotencyKey
        );

        res.status(201).json(result);
    } catch (error: any) {
        console.error('REST Booking Error:', error);

        // Map GraphQL/Service errors to HTTP codes
        let status = 500;
        if (error instanceof GraphQLError) {
            const code = error.extensions?.code;
            if (code === 'BAD_USER_INPUT') status = 400;
            else if (code === 'FORBIDDEN') status = 403;
            else if (code === 'NOT_FOUND') status = 404;
            else if (code === 'CONCURRENCY_CONFLICT') status = 409;
        }

        res.status(status).json({
            error: error.message || 'Internal Server Error',
            code: error.extensions?.code
        });
    }
};

export const getBooking = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id; // Must be authenticated to view own order

        if (!userId) { // If using as public/admin endpoint without token, might need adjustment
            // For now, assume strict auth for viewing
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const order = await bookingService.getOrderById(id, userId);
        const tickets = await bookingService.getTicketsByOrderId(id);

        res.json({ ...order, tickets });
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await bookingService.cancelBooking(userId, id);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
