import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${request.method} ${request.path}`, 'NOT_FOUND'));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      message: 'Unexpected server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
