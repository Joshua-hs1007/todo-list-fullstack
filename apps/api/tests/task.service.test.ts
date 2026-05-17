import { jest } from '@jest/globals';

import type { AppError } from '../src/lib/errors.js';
import { createTaskService } from '../src/modules/tasks/task.service.js';

type TaskDatabase = NonNullable<Parameters<typeof createTaskService>[0]>;

function task(
  overrides: Partial<Awaited<ReturnType<ReturnType<typeof createTaskService>['create']>>> = {},
) {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Task',
    description: null,
    status: 'TODO',
    dueDate: null,
    position: 0,
    createdAt: new Date('2026-05-16T00:00:00.000Z'),
    updatedAt: new Date('2026-05-16T00:00:00.000Z'),
    ...overrides,
  };
}

describe('taskService', () => {
  it('lists tasks scoped to the authenticated user with search and status filters', async () => {
    const findMany = jest.fn().mockResolvedValue([task()]);
    const service = createTaskService({ task: { findMany } } as unknown as TaskDatabase);

    const result = await service.list('user-1', { search: 'invoice', status: 'TODO' });

    expect(result).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'TODO',
        }),
      }),
    );
  });

  it('creates a task at the next position', async () => {
    const create = jest.fn().mockResolvedValue(task({ position: 3 }));
    const service = createTaskService({
      task: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: 2 } }),
        create,
      },
    } as unknown as TaskDatabase);

    await service.create('user-1', { title: 'Task' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Task',
          position: 3,
        }),
      }),
    );
  });

  it('rejects access to another user task', async () => {
    const service = createTaskService({
      task: { findUnique: jest.fn().mockResolvedValue(task({ userId: 'user-2' })) },
    } as unknown as TaskDatabase);

    await expect(service.get('user-1', 'task-1')).rejects.toMatchObject<AppError>({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('reorders owned tasks in a transaction', async () => {
    const update = jest.fn().mockResolvedValue(task());
    const transaction = jest.fn().mockResolvedValue([]);
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'task-2' }, { id: 'task-1' }])
      .mockResolvedValueOnce([
        task({ id: 'task-2', position: 0 }),
        task({ id: 'task-1', position: 1 }),
      ]);
    const service = createTaskService({
      $transaction: transaction,
      task: { findMany, update },
    } as unknown as TaskDatabase);

    const result = await service.reorder('user-1', { orderedTaskIds: ['task-2', 'task-1'] });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'task-2' },
      data: { position: 0 },
    });
    expect(result.map((item) => item.id)).toEqual(['task-2', 'task-1']);
  });

  it('rejects reorder requests containing another user task', async () => {
    const service = createTaskService({
      task: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'task-1' }])
          .mockResolvedValueOnce([task(), task({ id: 'task-2', userId: 'user-2' })]),
      },
    } as unknown as TaskDatabase);

    await expect(
      service.reorder('user-1', { orderedTaskIds: ['task-1', 'task-2'] }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });
});
