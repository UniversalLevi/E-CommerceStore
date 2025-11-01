import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => {
          const field = err.path.join('.');
          return `${field ? field + ': ' : ''}${err.message}`;
        }).join(', ');
        console.error('Validation error:', messages, 'Body:', req.body);
        return next(createError(`Validation failed: ${messages}`, 422));
      }
      next(error);
    }
  };
};

