import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../config/env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TicketForge API',
            version: '1.0.0',
            description: 'API documentation for TicketForge backend services',
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}`,
                description: 'Local Development Server',
            },
            {
                url: 'https://api.ticketforge.com/v1',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                // --- AUTH & USERS ---
                RegisterRequest: {
                    type: 'object',
                    required: ['fullName', 'email', 'password'],
                    properties: {
                        fullName: { type: 'string', minLength: 2, example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        password: { type: 'string', minLength: 8, example: 'StrongPass123!' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        password: { type: 'string', example: 'StrongPass123!' },
                    },
                },
                TokenResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    },
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
                        fullName: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },

                // --- UPLOAD ---
                UploadResponse: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', format: 'uri', example: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
                        publicId: { type: 'string', example: 'sample_id' },
                    },
                },

                // --- BOOKING (Requested) ---
                BookingRequest: {
                    type: 'object',
                    required: ['eventId', 'seatIds'],
                    properties: {
                        userId: { type: 'string', format: 'uuid', description: 'Often inferred from auth token', example: 'user-uuid' },
                        eventId: { type: 'string', format: 'uuid', example: 'event-uuid' },
                        seatIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' },
                            example: ['seat-1', 'seat-2']
                        },
                        idempotencyKey: { type: 'string', example: 'unique-key-123' },
                    },
                },
                BookingResponse: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], example: 'PENDING' },
                        totalAmount: { type: 'number', example: 1500 },
                        tickets: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    ticketId: { type: 'string', format: 'uuid' },
                                    seatId: { type: 'string' },
                                    qrCode: { type: 'string' },
                                },
                            },
                        },
                    },
                },

                // --- PRICING (Requested) ---
                PricingResponse: {
                    type: 'object',
                    properties: {
                        basePrice: { type: 'number', example: 1000 },
                        finalPrice: { type: 'number', example: 1250 },
                        demandMultiplier: { type: 'number', example: 1.25 },
                        breakdown: {
                            type: 'object',
                            properties: {
                                seatType: { type: 'string', example: 'PREMIUM' },
                                timeFactor: { type: 'number', example: 1.0 },
                            },
                        },
                    },
                },

                // --- FRAUD (Requested) ---
                FraudScore: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string', format: 'uuid' },
                        riskScore: { type: 'number', min: 0, max: 100, example: 15 },
                        riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'LOW' },
                        factors: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['IP_MISMATCH', 'VELOCITY_CHECK'],
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication and User Management' },
            { name: 'Booking', description: 'Ticket Booking and Order Management' },
            { name: 'Pricing', description: 'Dynamic Pricing Logic' },
            { name: 'Fraud', description: 'Fraud Detection and AI Analysis' },
            { name: 'Payments', description: 'Payment Processing Integration' },
            { name: 'Events', description: 'Event Management and Discovery' },
            { name: 'Upload', description: 'File Upload Service' },
        ],
    },
    apis: ['./src/**/*.routes.ts', './src/**/*.controller.ts', './src/docs/swagger/**/*.swagger.ts'], // Scan these files for annotations
};

export const swaggerSpec = swaggerJsdoc(options);
