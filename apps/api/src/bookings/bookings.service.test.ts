import { BookingService } from './bookings.service';
import { db } from '../db';
import { SEAT_LOCK_TTL_SECONDS } from '../lib/constants';
import * as demandService from '../services/demand.service';
import * as demandModel from '../ml/demandModel';

// 1. Mock DB
jest.mock('../db', () => ({
  db: {
    transaction: jest.fn(),
    select: jest.fn(),
    query: {
      orders: {
        findFirst: jest.fn(),
      },
      events: {
        findFirst: jest.fn(),
      },
    },
  },
}));

// Mock Kafka
jest.mock('../lib/kafka', () => ({
  sendEvent: jest.fn().mockResolvedValue(undefined),
}));

// Mock Logger
jest.mock('../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Demand Service
jest.mock('../services/demand.service', () => ({
  getBookingRate: jest.fn().mockResolvedValue(0.5),
  recordBookingDemand: jest.fn().mockResolvedValue(undefined),
}));

// Mock ML Model
jest.mock('../ml/demandModel', () => ({
  predictMultiplierByDemand: jest.fn().mockReturnValue(1.0),
}));

// Mock Razorpay
jest.mock('../lib/razorpay', () => ({
  razorpay: {
    orders: {
      create: jest.fn(),
    },
  },
}));

describe('BookingService', () => {
  let service: BookingService;

  const mockTx = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    query: {
      events: {
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingService();

    (db.transaction as jest.Mock).mockImplementation((cb) => cb(mockTx));

    // Mock db.select for getTicketsSoldByEventId
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      }),
    });
  });

  describe('bookTickets', () => {
    const mockUserId = 'user-123';
    const mockEventId = 'event-123';
    const mockSeatIds = ['seat-1'];

    it('should throw error if no seats provided', async () => {
      await expect(service.bookTickets(mockUserId, mockEventId, []))
        .rejects
        .toThrow('No seats selected');
    });

    it('should fail if seat lock is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setSeconds(expiredDate.getSeconds() - (SEAT_LOCK_TTL_SECONDS + 100));

      mockTx.where.mockResolvedValueOnce([
        {
          seatId: 'seat-1',
          status: 'LOCKED',
          updatedAt: expiredDate,
          lockedBy: mockUserId,
          price: 1000,
          sectionName: 'VIP',
          number: 'A1'
        }
      ]);

      await expect(service.bookTickets(mockUserId, mockEventId, mockSeatIds))
        .rejects
        .toThrow(/session expired/);
    });

    it('should fail if seat is locked by another user', async () => {
      mockTx.where.mockResolvedValueOnce([
        {
          seatId: 'seat-1',
          status: 'LOCKED',
          updatedAt: new Date(),
          lockedBy: 'OTHER_USER',
          price: 1000,
          sectionName: 'VIP',
          number: 'A1'
        }
      ]);

      await expect(service.bookTickets(mockUserId, mockEventId, mockSeatIds))
        .rejects
        .toThrow(/session expired or lost/);
    });

    it('should succeed when all conditions are met', async () => {
      // 1. Mock Seat Search
      mockTx.where.mockResolvedValueOnce([
        {
          seatId: 'seat-1',
          status: 'LOCKED',
          updatedAt: new Date(),
          lockedBy: mockUserId,
          price: 1000,
          sectionName: 'VIP',
          row: 'A',
          number: '1'
        }
      ]);

      // 2. Mock Event for pricing
      mockTx.query.events.findFirst.mockResolvedValue({
        id: mockEventId,
        date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h away
      });

      // 3. Mock Order Creation
      mockTx.returning.mockReturnValueOnce([{ id: 'order-1', status: 'PENDING', totalAmount: 1500 }]);

      // 4. Mock Seat Update
      mockTx.returning.mockReturnValueOnce([{ seatId: 'seat-1' }]);

      // 5. Mock Ticket Insertion
      mockTx.returning.mockReturnValueOnce([{
        id: 'ticket-1',
        orderId: 'order-1',
        eventId: mockEventId,
        seatId: 'seat-1'
      }]);

      const result = await service.bookTickets(mockUserId, mockEventId, mockSeatIds);

      expect(result).toHaveProperty('id', 'order-1');
      expect(mockTx.insert).toHaveBeenCalled();
    });
  });
});