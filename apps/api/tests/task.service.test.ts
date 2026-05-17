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

  it('lists tasks without optional filters', async () => {
    const findMany = jest.fn().mockResolvedValue([task()]);
    const service = createTaskService({ task: { findMany } } as unknown as TaskDatabase);

    await service.list('user-1', {});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          status: undefined,
          OR: undefined,
        },
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

  it('defaults the first created task to TODO at position zero', async () => {
    const create = jest.fn().mockResolvedValue(task());
    const service = createTaskService({
      task: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: null } }),
        create,
      },
    } as unknown as TaskDatabase);

    await service.create('user-1', { title: 'Task' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'TODO',
          position: 0,
        }),
      }),
    );
  });

  it('converts due date strings before saving', async () => {
    const create = jest.fn().mockResolvedValue(task());
    const service = createTaskService({
      task: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: 0 } }),
        create,
      },
    } as unknown as TaskDatabase);

    await service.create('user-1', {
      title: 'Task',
      dueDate: '2026-06-01T00:00:00.000Z',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: new Date('2026-06-01T00:00:00.000Z'),
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

  it('rejects missing tasks as not found', async () => {
    const service = createTaskService({
      task: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as TaskDatabase);

    await expect(service.get('user-1', 'missing-task')).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'TASK_NOT_FOUND',
    });
  });

  it('updates only tasks owned by the user', async () => {
    const update = jest.fn().mockResolvedValue(task({ title: 'Updated' }));
    const service = createTaskService({
      task: {
        findUnique: jest.fn().mockResolvedValue(task()),
        update,
      },
    } as unknown as TaskDatabase);

    const result = await service.update('user-1', 'task-1', {
      title: 'Updated',
      status: 'DONE',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({
        title: 'Updated',
        status: 'DONE',
      }),
    });
    expect(result.title).toBe('Updated');
  });

  it('deletes only tasks owned by the user', async () => {
    const remove = jest.fn().mockResolvedValue(task());
    const service = createTaskService({
      task: {
        findUnique: jest.fn().mockResolvedValue(task()),
        delete: remove,
      },
    } as unknown as TaskDatabase);

    await service.delete('user-1', 'task-1');

    expect(remove).toHaveBeenCalledWith({ where: { id: 'task-1' } });
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

  it('rejects reorder requests containing missing tasks', async () => {
    const service = createTaskService({
      task: {
        findMany: jest.fn().mockResolvedValueOnce([{ id: 'task-1' }]).mockResolvedValueOnce([]),
      },
    } as unknown as TaskDatabase);

    await expect(
      service.reorder('user-1', { orderedTaskIds: ['task-1', 'missing-task'] }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'TASK_NOT_FOUND',
    });
  });
});
