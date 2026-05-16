import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors.js';

export function register(_request: Request, _response: Response) {
  throw new AppError(501, 'Registration is not implemented yet.');
}

export function login(_request: Request, _response: Response) {
  throw new AppError(501, 'Login is not implemented yet.');
}

export function me(request: Request, response: Response) {
  response.status(200).json({ user: request.user });
}
