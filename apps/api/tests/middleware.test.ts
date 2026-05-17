import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { AppError } from '../src/lib/errors.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { requireAuth } from '../src/middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';
import { validateRequest } from '../src/middleware/validate.middleware.js';

function response() {
  const output = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return output as unknown as Response & typeof output;
}

describe('auth middleware', () => {
  it('attaches the authenticated user from a valid bearer token', () => {
    const token = signAccessToken({ userId: 'user-1', email: 'user@example.com' });
    const request = {
      header: jest.fn().mockReturnValue(`Bearer ${token}`),
    } as unknown as Request;
    const next = jest.fn<NextFunction>();

    requireAuth(request, response(), next);

    expect(request.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects missing or invalid bearer tokens', () => {
    const missingRequest = { header: jest.fn().mockReturnValue(undefined) } as unknown as Request;
    const invalidRequest = {
      header: jest.fn().mockReturnValue('Bearer invalid-token'),
    } as unknown as Request;
    const next = jest.fn<NextFunction>();

    requireAuth(missingRequest, response(), next);
    requireAuth(invalidRequest, response(), next);

    expect(next).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }),
    );
    expect(next).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }),
    );
  });
});

describe('request validation middleware', () => {
  it('parses body, params, and query values before continuing', () => {
    const request = {
      body: { title: 'Task' },
      params: { id: 'task-1' },
      query: { page: '2' },
    } as unknown as Request;
    const next = jest.fn<NextFunction>();

    validateRequest({
      body: z.object({ title: z.string().min(1) }),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({ page: z.coerce.number().int() }),
    })(request, response(), next);

    expect(request.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });
});

describe('error middleware', () => {
  it('returns structured validation errors', () => {
    const error = z.object({ email: z.string().email() }).safeParse({ email: 'invalid' }).error;
    const output = response();

    errorHandler(error, {} as Request, output, jest.fn());

    expect(output.status).toHaveBeenCalledWith(400);
    expect(output.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        }),
      }),
    );
  });

  it('returns structured application and fallback errors', () => {
    const appOutput = response();
    const fallbackOutput = response();

    errorHandler(new AppError(403, 'Forbidden', 'FORBIDDEN'), {} as Request, appOutput, jest.fn());
    errorHandler(new Error('boom'), {} as Request, fallbackOutput, jest.fn());

    expect(appOutput.status).toHaveBeenCalledWith(403);
    expect(appOutput.json).toHaveBeenCalledWith({
      error: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
        details: undefined,
      },
    });
    expect(fallbackOutput.status).toHaveBeenCalledWith(500);
    expect(fallbackOutput.json).toHaveBeenCalledWith({
      error: {
        message: 'Unexpected server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  });

  it('turns unknown routes into not found application errors', () => {
    const next = jest.fn<NextFunction>();

    notFoundHandler({ method: 'GET', path: '/missing' } as Request, response(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Route not found: GET /missing',
      }),
    );
  });
});
