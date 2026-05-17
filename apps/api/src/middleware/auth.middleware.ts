import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(new AppError(401, 'Authentication is required.', 'UNAUTHORIZED'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    next(new AppError(401, 'Authentication token is invalid.', 'UNAUTHORIZED'));
  }
}
