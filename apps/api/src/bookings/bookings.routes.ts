import { Router } from 'express';
import { createBooking, getBooking, cancelBooking } from './bookings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public/Open route (allows userId in body for testing flexibility)
// In prod, strictly requireAuth
router.post('/', (req, res, next) => {
    // Optional auth check - if token present, populate req.user, else proceed
    const authHeader = req.headers.authorization;
    if (authHeader) {
        requireAuth(req, res, next);
    } else {
        next();
    }
}, createBooking);

router.get('/:id', requireAuth, getBooking);
router.post('/:id/cancel', requireAuth, cancelBooking);

export default router;
