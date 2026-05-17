import type { Request, Response } from 'express';

import { authService } from './auth.service.js';

export async function register(request: Request, response: Response) {
  const result = await authService.register(request.body);

  response.status(201).json(result);
}

export async function login(request: Request, response: Response) {
  const result = await authService.login(request.body);

  response.status(200).json(result);
}

export function me(request: Request, response: Response) {
  response.status(200).json({ user: request.user });
}
