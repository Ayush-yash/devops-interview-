import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export const correlationIdMiddleware = (
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if incoming request already has a correlation ID
  const correlationId = (req.header('X-Correlation-ID') || randomUUID()).toString();
  
  // Attach correlation ID to request context
  req.correlationId = correlationId;
  
  // Return the correlation ID in the response headers for transparency
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};
