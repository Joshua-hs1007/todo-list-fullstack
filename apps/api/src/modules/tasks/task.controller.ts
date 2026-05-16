import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors.js';

export function listTasks(_request: Request, _response: Response) {
  throw new AppError(501, 'Task listing is not implemented yet.');
}

export function createTask(_request: Request, _response: Response) {
  throw new AppError(501, 'Task creation is not implemented yet.');
}

export function getTask(_request: Request, _response: Response) {
  throw new AppError(501, 'Task detail is not implemented yet.');
}

export function updateTask(_request: Request, _response: Response) {
  throw new AppError(501, 'Task update is not implemented yet.');
}

export function deleteTask(_request: Request, _response: Response) {
  throw new AppError(501, 'Task deletion is not implemented yet.');
}

export function reorderTasks(_request: Request, _response: Response) {
  throw new AppError(501, 'Task reorder is not implemented yet.');
}
