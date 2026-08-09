import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// 1. Zod Schemas for input validation
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['candidate', 'recruiter', 'admin'] as [string, ...string[]]).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required')
});

export const sessionStartSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'] as [string, ...string[]]),
  totalQuestions: z.coerce.number().int().min(1, 'Questions count must be at least 1').max(20, 'Max 20 questions allowed per session')
});

export const questionGenerateSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format')
});

export const answerSubmitSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format'),
  questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format'),
  userSelectedIndex: z.number().int().min(0).max(3),
  userAnswer: z.string().optional()
});

// 2. Generic validation middleware
export const validateSchema = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        console.warn('[Validation Warning] Request body validation failed:', {
          path: req.originalUrl,
          errors: formattedErrors
        });

        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      next(error);
    }
  };
};
