import { EventService } from './events.service';

// Mock the database
jest.mock('../db', () => ({
    db: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn(),
        execute: jest.fn(),
    },
}));

// Mock the logger
jest.mock('../lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('EventService - Unit Tests', () => {
    let eventService: EventService;
    let mockDb: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Get the mocked db
        mockDb = require('../db').db;

        // Create new service instance
        eventService = new EventService();
    });

    describe('Venue Operations', () => {
        describe('getVenues', () => {
            test('should return list of venues', async () => {
                const mockVenues = [
                    { id: '1', name: 'Venue A', location: 'City A', capacity: 1000 },
                    { id: '2', name: 'Venue B', location: 'City B', capacity: 500 },
                ];

                // Mock the database query chain
                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockResolvedValue(mockVenues),
                    }),
                });

                const result = await eventService.getVenues();

                expect(result).toEqual(mockVenues);
                expect(result).toHaveLength(2);
            });

            test('should return empty array on error', async () => {
                // Mock database error
                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockRejectedValue(new Error('DB Error')),
                    }),
                });

                const result = await eventService.getVenues();

                expect(result).toEqual([]);
            });
        });

        describe('getVenueById', () => {
            test('should return venue by ID', async () => {
                const mockVenue = { id: '1', name: 'Test Venue', location: 'Test City', capacity: 1000 };

                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([mockVenue]),
                    }),
                });

                const result = await eventService.getVenueById('1');

                expect(result).toEqual(mockVenue);
            });

            test('should return undefined for non-existent venue', async () => {
                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

                const result = await eventService.getVenueById('999');

                expect(result).toBeUndefined();
            });
        });

        describe('createVenue', () => {
            test('should create a new venue', async () => {
                const venueData = {
                    name: 'New Venue',
                    location: 'New City',
                    capacity: 2000,
                };

                const createdVenue = { id: '123', ...venueData };

                mockDb.insert.mockReturnValue({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([createdVenue]),
                    }),
                });

                const result = await eventService.createVenue(venueData);

                expect(result).toEqual(createdVenue);
                expect(result.name).toBe('New Venue');
                expect(result.capacity).toBe(2000);
            });
        });

        describe('updateVenue', () => {
            test('should update venue successfully', async () => {
                const updateData = { name: 'Updated Venue' };
                const updatedVenue = { id: '1', name: 'Updated Venue', location: 'City', capacity: 1000 };

                mockDb.update.mockReturnValue({
                    set: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            returning: jest.fn().mockResolvedValue([updatedVenue]),
                        }),
                    }),
                });

                const result = await eventService.updateVenue('1', updateData);

                expect(result).toEqual(updatedVenue);
                expect(result.name).toBe('Updated Venue');
            });

            test('should throw error if venue not found', async () => {
                mockDb.update.mockReturnValue({
                    set: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            returning: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                });

                await expect(eventService.updateVenue('999', { name: 'Test' }))
                    .rejects
                    .toThrow('Venue 999 not found');
            });
        });
    });

    describe('Event Operations', () => {
        describe('getEventById', () => {
            test('should return event by ID', async () => {
                const mockEvent = {
                    id: 'event-1',
                    name: 'Rock Concert',
                    venueId: 'venue-1',
                    date: new Date('2026-12-31'),
                    status: 'PUBLISHED',
                };

                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([mockEvent]),
                    }),
                });

                const result = await eventService.getEventById('event-1');

                expect(result).toEqual(mockEvent);
                expect(result.name).toBe('Rock Concert');
            });
        });

        describe('createEvent', () => {
            test('should create a new event', async () => {
                const eventData = {
                    name: 'New Concert',
                    description: 'Amazing concert',
                    venueId: 'venue-1',
                    date: '2026-12-31',
                    imageUrl: '/images/concert.jpg',
                };

                const createdEvent = {
                    id: 'event-123',
                    ...eventData,
                    date: new Date(eventData.date),
                    status: 'DRAFT',
                };

                mockDb.insert.mockReturnValue({
                    values: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([createdEvent]),
                    }),
                });

                const result = await eventService.createEvent(eventData);

                expect(result).toEqual(createdEvent);
                expect(result.status).toBe('DRAFT');
                expect(result.name).toBe('New Concert');
            });
        });

        describe('updateEvent', () => {
            test('should update event successfully', async () => {
                const updateData = {
                    name: 'Updated Concert',
                    status: 'PUBLISHED',
                };

                const updatedEvent = {
                    id: 'event-1',
                    name: 'Updated Concert',
                    status: 'PUBLISHED',
                    venueId: 'venue-1',
                    date: new Date('2026-12-31'),
                };

                mockDb.update.mockReturnValue({
                    set: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            returning: jest.fn().mockResolvedValue([updatedEvent]),
                        }),
                    }),
                });

                const result = await eventService.updateEvent('event-1', updateData);

                expect(result).toEqual(updatedEvent);
                expect(result.name).toBe('Updated Concert');
                expect(result.status).toBe('PUBLISHED');
            });

            test('should throw error if event not found', async () => {
                mockDb.update.mockReturnValue({
                    set: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            returning: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                });

                await expect(eventService.updateEvent('999', { name: 'Test' }))
                    .rejects
                    .toThrow('Event 999 not found');
            });
        });
    });

    describe('Section Operations', () => {
        describe('getSectionById', () => {
            test('should return section by ID', async () => {
                const mockSection = {
                    id: 'section-1',
                    venueId: 'venue-1',
                    name: 'VIP Section',
                    capacity: 100,
                    basePrice: 5000,
                };

                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([mockSection]),
                    }),
                });

                const result = await eventService.getSectionById('section-1');

                expect(result).toEqual(mockSection);
                expect(result.name).toBe('VIP Section');
            });
        });

        describe('getSectionsByVenueId', () => {
            test('should return all sections for a venue', async () => {
                const mockSections = [
                    { id: '1', name: 'VIP', capacity: 100, basePrice: 5000 },
                    { id: '2', name: 'General', capacity: 500, basePrice: 1000 },
                ];

                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue(mockSections),
                    }),
                });

                const result = await eventService.getSectionsByVenueId('venue-1');

                expect(result).toEqual(mockSections);
                expect(result).toHaveLength(2);
            });

            test('should return empty array if no sections found', async () => {
                mockDb.select.mockReturnValue({
                    from: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                });

                const result = await eventService.getSectionsByVenueId('venue-999');

                expect(result).toEqual([]);
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined inputs gracefully', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await eventService.getVenueById('');
            expect(result).toBeUndefined();
        });

        test('should handle database connection errors', async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    orderBy: jest.fn().mockRejectedValue(new Error('Connection failed')),
                }),
            });

            const result = await eventService.getVenues();
            expect(result).toEqual([]);
        });
    });
});

/**
 * TO RUN THESE TESTS:
 * 
 * cd apps/api
 * pnpm test events.service.test.ts
 * 
 * NOTE: These are unit tests with mocked database.
 * For integration tests with real database, see events.service.integration.test.ts
 */
