import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Enable default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define custom Prometheus metrics
// 1. HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 2. HTTP Request Duration Histogram
export const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30], // custom latency buckets
  registers: [register]
});

// 3. Claude API Counter
export const claudeRequestCounter = new client.Counter({
  name: 'claude_api_calls_total',
  help: 'Total number of requests sent to the Claude API',
  labelNames: ['agent_role', 'status'], // e.g., interviewer, evaluator, coach | success, error
  registers: [register]
});

// 4. Claude API Latency Histogram
export const claudeDurationHistogram = new client.Histogram({
  name: 'claude_api_duration_seconds',
  help: 'Latency of Claude API completions in seconds',
  labelNames: ['agent_role', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 20, 45, 60],
  registers: [register]
});

// 5. Active Sessions Gauge
export const activeSessionsGauge = new client.Gauge({
  name: 'active_interview_sessions_total',
  help: 'Total number of active (incomplete) interview sessions',
  registers: [register]
});

// HTTP metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  // Hook response completion
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Resolve matching route pattern (e.g. /api/session/123/report -> /api/session/:id/report)
    let route = req.baseUrl + (req.route ? req.route.path : req.path);
    if (!route) {
      route = req.path || 'unknown';
    }

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    };
    
    // Increment request count and duration logs
    httpRequestCounter.labels(labels.method, labels.route, labels.status_code).inc();
    httpRequestDurationHistogram.labels(labels.method, labels.route, labels.status_code).observe(durationInSeconds);
  });
  
  next();
};

// Route handler for prometheus scraping
export const getMetrics = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
};
