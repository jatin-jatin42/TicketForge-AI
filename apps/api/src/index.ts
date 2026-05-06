import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createHandler } from 'graphql-http/lib/use/express';
import { buildSchema } from 'graphql';
import jwt from 'jsonwebtoken';
import authRoutes from './auth/auth.routes';
import bookingRoutes from './bookings/bookings.routes';
import uploadRoutes from './upload/upload.routes';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { connectKafkaProducer, connectKafkaConsumer } from './lib/kafka';
import { initDemandModel } from "./ml/demandModel";
import { initHotEventModel } from "./ml/hotEventModel";


// --- GraphQL Imports ---
import { authTypeDefs, authResolvers } from './auth/auth.graphql';
import { eventTypeDefs } from './events/events.graphql';
import { eventResolvers } from './events/events.resolver';
// Import Booking Module
import { bookingTypeDefs } from './bookings/bookings.graphql';
import { bookingResolvers } from './bookings/bookings.resolver';
// Import User Module
import { userTypeDefs } from './users/users.graphql';
import { userResolvers } from './users/users.resolver';
// Import Analytics Module
import { analyticsTypeDefs } from './analytics/analytics.graphql';
import { analyticsResolvers } from './analytics/analytics.resolver';



const app = express();
const httpServer = createServer(app);

// Simple Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  socket.on("join-event", (eventId) => {
    socket.join(`event:${eventId}`);
    logger.info(`Socket ${socket.id} joined event:${eventId}`);
  });

  socket.on("leave-event", (eventId) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Attach io to request or global if needed, for now just running side-by-side


// Trust Proxy for Rate Limiting
app.set('trust proxy', 1);

// 1. Middleware
app.use(cors());

// [FIX] express.json() MUST NOT be used on the GraphQL route when using graphql-http
// [FIX] Enable express.json() globally. 
// If graphql-http has issues, we can revisit, but usually standard JSON parsing is fine or even required for some setups.
app.use(express.json());

// --- Swagger Documentation ---
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger/swagger.config';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(apiRateLimiter);

// 2. Logging


// Health Check
app.get('/', (req, res) => {
  res.send('TicketForge API is running');
});

// Routes
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api/upload", uploadRoutes);


// --- GraphQL Setup ---
const schema = buildSchema(`
  type Query {
    hello: String
  }
  
  type Mutation {
    _empty: String
  }

  ${authTypeDefs}
  ${eventTypeDefs}
  ${bookingTypeDefs}
  ${userTypeDefs}
  ${analyticsTypeDefs}
`);

// --- Manual Resolver Attachment ---
// Required because buildSchema + rootValue doesn't support Type resolvers (like Order.tickets)
import { GraphQLObjectType } from 'graphql';

// Attach Order resolvers
// Attach Order resolvers
const orderType = schema.getType('Order') as GraphQLObjectType;
if (orderType && bookingResolvers.Order) {
  const fields = orderType.getFields();
  if (fields.tickets && bookingResolvers.Order.tickets) {
    fields.tickets.resolve = bookingResolvers.Order.tickets;

  }
  if (fields.event && bookingResolvers.Order.event) {
    fields.event.resolve = bookingResolvers.Order.event;

  }
}

// Attach Venue resolvers
const venueType = schema.getType('Venue') as GraphQLObjectType;
if (venueType && eventResolvers.Venue) {
  const fields = venueType.getFields();
  if (fields.sections && eventResolvers.Venue.sections) {
    fields.sections.resolve = eventResolvers.Venue.sections;

  }
}

// Attach Event resolvers (Extended by Booking Module)
const eventType = schema.getType('Event') as GraphQLObjectType;
if (eventType && bookingResolvers.Event) {
  const fields = eventType.getFields();
  if (fields.ticketsSold && bookingResolvers.Event.ticketsSold) {
    fields.ticketsSold.resolve = bookingResolvers.Event.ticketsSold;

  }
}


// Flatten all resolvers for buildSchema compatibility
const root = {
  hello: () => 'Hello from TicketForge API!',

  // Auth Resolvers are FLAT (register, login, refreshToken)
  ...authResolvers,

  // Event Resolvers - flatten Query and Mutation
  ...eventResolvers.Query,
  ...eventResolvers.Mutation,

  // Booking Resolvers - flatten Query and Mutation
  ...bookingResolvers.Query,
  ...bookingResolvers.Mutation,

  // User Resolvers - flatten Query and Mutation
  ...userResolvers.Query,
  ...userResolvers.Mutation,

  // Analytics Resolvers
  ...analyticsResolvers.Query,
};



// 3. SECURED GRAPHQL HANDLER with Context Injection
const contextAwareRoot = (context: any) => {
  const enhancedRoot: any = { ...root };

  // Wrap user Query resolvers to inject context
  if (userResolvers.Query) {
    Object.keys(userResolvers.Query).forEach((key: string) => {
      enhancedRoot[key] = (args: any) => (userResolvers.Query as any)[key](null, { ...args, ...context });
    });
  }

  // Wrap user Mutation resolvers to inject context  
  if (userResolvers.Mutation) {
    Object.keys(userResolvers.Mutation).forEach((key: string) => {
      enhancedRoot[key] = (args: any) => (userResolvers.Mutation as any)[key](null, { ...args, ...context });
    });
  }

  return enhancedRoot;
};

// [DEBUG] Handler Wrapper to inspect 415 error
const graphqlHandler = createHandler({
  schema,
  rootValue: root,
  context: async (req: any) => {
    const authHeader = (req.headers as any).authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const user = jwt.verify(token, env.JWT_ACCESS_SECRET);
          return { user };
        } catch (err: any) {
          return { user: null };
        }
      }
    }
    return { user: null };
  }
});

app.all('/graphql', (req, res, next) => {
  // [DEBUG] Log Request Details
  console.log('------------ GraphQL Request Debug ------------');
  console.log('Method:', req.method);
  console.log('Original Content-Type:', req.headers['content-type']);
  console.log('Body Type:', typeof req.body);
  console.log('Body Keys:', req.body ? Object.keys(req.body) : 'null');

  // [FIX] Force Content-Type to application/json to avoid 415 error from strict graphql-http check
  req.headers['content-type'] = 'application/json; charset=utf-8';

  console.log('Forced Content-Type:', req.headers['content-type']);
  console.log('-----------------------------------------------');

  // [FIX] Force Content-Type to application/json to avoid 415 error from strict graphql-http check
  req.headers['content-type'] = 'application/json; charset=utf-8';
  return graphqlHandler(req, res, next);
});

// DB Check Endpoint
app.get('/db-check', async (req, res) => {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    res.json({ status: 'ok', time: result.rows[0] });
  } catch (error) {
    logger.error('DB Check failed', { error });
    res.status(500).json({ status: 'error', message: (error as any).message });
  }
});

// 4. Global Error Handler
app.use(errorHandler);

// 5. Start Server
// httpServer.listen(env.PORT, async () => {
//   // Initialize Kafka Producer before accepting traffic
//   connectKafkaProducer().catch((err) => {
//     logger.warn('⚠️  Kafka connection failed (non-critical):', err);
//   });
//   logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
//   logger.info(`📊 GraphQL endpoint: http://localhost:${env.PORT}/graphql`);
// });// Force reload

httpServer.listen(env.PORT, async () => {
  try {
    // 1️⃣ Initialize TensorFlow.js demand pricing model & Hot Event Model
    await Promise.all([
      initDemandModel(),
      initHotEventModel()
    ]);
    logger.info("🤖 AI ML models (Pricing & HotEvents) initialized");

    // 2️⃣ Initialize Kafka Producer
    connectKafkaProducer().catch((err) => {
      logger.warn('⚠️  Kafka connection failed (non-critical):', err);
    });

    // 3️⃣ Initialize Kafka Consumer (WebSocket Bridge)
    connectKafkaConsumer(io).catch((err: any) => {
      logger.warn('⚠️  Kafka Consumer connection failed:', err);
    });

    // 3️⃣ Server ready
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`📊 GraphQL endpoint: http://localhost:${env.PORT}/graphql`);
  } catch (err) {
    logger.error("❌ Failed to initialize AI pricing model", err);
    process.exit(1); // fail fast if AI init fails
  }
});
