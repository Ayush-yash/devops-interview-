import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import testRoutes from './routes/testRoutes';
import sessionRoutes from './routes/sessionRoutes';
import recruiterRoutes from './routes/recruiterRoutes';
import adminRoutes from './routes/adminRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { correlationIdMiddleware } from './middleware/correlationMiddleware';
import { metricsMiddleware, getMetrics } from './middleware/metrics';

// Load environment variables
dotenv.config();

// Centralized Config Validation (Fail Fast)
console.log('[Startup Check] Validating system configurations...');
if (!process.env.JWT_SECRET) {
  console.error('[Startup Check] FATAL ERROR: JWT_SECRET environment variable is missing!');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('[Startup Check] FATAL ERROR: MONGO_URI environment variable is missing!');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
  console.warn('[Startup Check] WARNING: ANTHROPIC_API_KEY is not configured. Multi-agent evaluation will run in MOCK fallback mode.');
} else {
  console.log('[Startup Check] Anthropic Claude API integration active.');
}

console.log('[Startup Check] Configuration validated successfully.');

// Connect Database
connectDB();

const app = express();

// Secure Headers
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Traceability Correlation ID Middleware
app.use(correlationIdMiddleware);

// Request Logging with correlation ID context
morgan.token('correlation-id', (req: any) => req.correlationId || '-');
app.use(morgan('[:correlation-id] :method :url :status :res[content-length] - :response-time ms'));

// Rate Limiting Config
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window (signup/login)
  message: { message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  message: { message: 'Rate limit exceeded. Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Metrics tracking middleware
app.use(metricsMiddleware);

// Expose metrics endpoint (no auth, no rate limiting for Prometheus scrapers)
app.get('/api/metrics', getMetrics as any);

// Routing
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/test', apiLimiter, testRoutes);
app.use('/api/recruiter', apiLimiter, recruiterRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api', apiLimiter, sessionRoutes);
app.use('/api', apiLimiter, apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export { app, server };
