import { jest } from '@jest/globals';
import request from 'supertest';

const database = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  task: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.unstable_mockModule('../src/lib/prisma.js', () => ({ prisma: database }));

const { createApp } = await import('../src/app.js');
const { hashPassword } = await import('../src/lib/password.js');
const { signAccessToken } = await import('../src/lib/jwt.js');

const app = createApp();

function task(overrides: Record<string, unknown> = {}) {
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

function authHeader() {
  return `Bearer ${signAccessToken({ userId: 'user-1', email: 'user@example.com' })}`;
}

describe('app routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('serves health and OpenAPI documents', async () => {
    const healthBody = {
      name: 'To Do List API',
      description: 'Express API for the full-stack To Do List application.',
      status: 'ok',
    };

    await expect(request(app).get('/')).resolves.toMatchObject({
      status: 200,
      body: healthBody,
    });

    await expect(request(app).get('/health')).resolves.toMatchObject({
      status: 200,
      body: healthBody,
    });

    const openApiResponse = await request(app).get('/api/openapi.json');

    expect(openApiResponse.status).toBe(200);
    expect(openApiResponse.body.info.title).toBe('To Do List API');
    expect(openApiResponse.body.tags).toEqual([
      expect.objectContaining({ name: 'System' }),
      expect.objectContaining({ name: 'Auth' }),
      expect.objectContaining({ name: 'Tasks' }),
    ]);
    expect(openApiResponse.body.paths['/health'].get.tags).toEqual(['System']);
    expect(openApiResponse.body.paths['/api/auth/login'].post.tags).toEqual(['Auth']);
    expect(openApiResponse.body.paths['/api/tasks'].get.tags).toEqual(['Tasks']);
  });

  it('validates auth payloads and registers users', async () => {
    database.user.create.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    const invalidResponse = await request(app).post('/api/auth/register').send({
      email: 'invalid',
      password: 'short',
    });
    const response = await request(app).post('/api/auth/register').send({
      email: 'User@Example.COM',
      password: 'password123',
    });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(response.body.token).toEqual(expect.any(String));
    expect(database.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com',
          passwordHash: expect.not.stringMatching('password123'),
        }),
      }),
    );
  });

  it('logs in users and exposes the current authenticated user', async () => {
    database.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: await hashPassword('password123'),
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'USER@example.com',
      password: 'password123',
    });
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe('user@example.com');
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toEqual({ id: 'user-1', email: 'user@example.com' });
  });

  it('protects task routes and validates task payloads', async () => {
    const unauthenticated = await request(app).get('/api/tasks');
    const invalidReorder = await request(app)
      .patch('/api/tasks/reorder')
      .set('Authorization', authHeader())
      .send({ orderedTaskIds: ['task-1', 'task-1'] });

    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHORIZED');
    expect(invalidReorder.status).toBe(400);
    expect(invalidReorder.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates, lists, reads, updates, deletes, and reorders authenticated user tasks', async () => {
    database.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
    database.task.create.mockResolvedValue(task({ id: 'task-created', title: 'Created' }));
    database.task.findMany
      .mockResolvedValueOnce([task({ id: 'task-created', title: 'Created' })])
      .mockResolvedValueOnce([{ id: 'task-2' }, { id: 'task-1' }])
      .mockResolvedValueOnce([task({ id: 'task-2', position: 0 }), task({ position: 1 })]);
    database.task.findUnique.mockResolvedValue(task());
    database.task.update.mockResolvedValue(task({ title: 'Updated' }));
    database.task.delete.mockResolvedValue(task());
    database.$transaction.mockResolvedValue([]);

    const createResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', authHeader())
      .send({ title: 'Created' });
    const listResponse = await request(app)
      .get('/api/tasks?search=Created&status=TODO')
      .set('Authorization', authHeader());
    const getResponse = await request(app)
      .get('/api/tasks/task-1')
      .set('Authorization', authHeader());
    const updateResponse = await request(app)
      .patch('/api/tasks/task-1')
      .set('Authorization', authHeader())
      .send({ title: 'Updated' });
    const deleteResponse = await request(app)
      .delete('/api/tasks/task-1')
      .set('Authorization', authHeader());
    const reorderResponse = await request(app)
      .patch('/api/tasks/reorder')
      .set('Authorization', authHeader())
      .send({ orderedTaskIds: ['task-2', 'task-1'] });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.task.title).toBe('Created');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.tasks).toHaveLength(1);
    expect(getResponse.status).toBe(200);
    expect(updateResponse.body.task.title).toBe('Updated');
    expect(deleteResponse.body).toEqual({ id: 'task-1' });
    expect(reorderResponse.body.tasks.map((item: { id: string }) => item.id)).toEqual([
      'task-2',
      'task-1',
    ]);
  });

  it('returns not found for unknown routes', async () => {
    const response = await request(app).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
