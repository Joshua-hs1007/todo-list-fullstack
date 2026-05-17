import type { Request, Response } from 'express';
import { jest } from '@jest/globals';

import type { AppError } from '../src/lib/errors.js';
import { getTask, listTasks } from '../src/modules/tasks/task.controller.js';

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('task controller guards', () => {
  it('requires an authenticated request user', async () => {
    await expect(listTasks({ query: {} } as Request, response())).rejects.toMatchObject<AppError>({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('rejects invalid task id params', async () => {
    await expect(
      getTask(
        { user: { id: 'user-1', email: 'user@example.com' }, params: {} } as Request,
        response(),
      ),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });
});
