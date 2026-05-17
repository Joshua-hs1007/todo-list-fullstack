import { HttpClient } from '@angular/common/http';
import type { HttpParams } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './api-client';

describe('ApiClient', () => {
  function setup() {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    const injector = Injector.create({
      providers: [{ provide: HttpClient, useValue: http }],
    });
    const client = runInInjectionContext(injector, () => new ApiClient());

    return { client, http };
  }

  it('calls auth endpoints with typed payloads', () => {
    const { client, http } = setup();
    const credentials = { email: 'user@example.com', password: 'password123' };

    client.register(credentials);
    client.login(credentials);
    client.me();

    expect(http.post).toHaveBeenNthCalledWith(1, '/api/auth/register', credentials);
    expect(http.post).toHaveBeenNthCalledWith(2, '/api/auth/login', credentials);
    expect(http.get).toHaveBeenCalledWith('/api/auth/me');
  });

  it('calls task endpoints with query params and request bodies', () => {
    const { client, http } = setup();

    client.listTasks({ search: 'invoice', status: 'DONE' });
    client.getTask('task-1');
    client.createTask({ title: 'Task' });
    client.updateTask('task-1', { title: 'Updated' });
    client.deleteTask('task-1');
    client.reorderTasks(['task-2', 'task-1']);

    const listOptions = http.get.mock.calls[0]?.[1] as { params: HttpParams };
    expect(http.get.mock.calls[0]?.[0]).toBe('/api/tasks');
    expect(listOptions.params.get('search')).toBe('invoice');
    expect(listOptions.params.get('status')).toBe('DONE');
    expect(http.get).toHaveBeenNthCalledWith(2, '/api/tasks/task-1');
    expect(http.post).toHaveBeenCalledWith('/api/tasks', { title: 'Task' });
    expect(http.patch).toHaveBeenNthCalledWith(1, '/api/tasks/task-1', { title: 'Updated' });
    expect(http.delete).toHaveBeenCalledWith('/api/tasks/task-1');
    expect(http.patch).toHaveBeenNthCalledWith(2, '/api/tasks/reorder', {
      orderedTaskIds: ['task-2', 'task-1'],
    });
  });

  it('omits empty task list filters', () => {
    const { client, http } = setup();

    client.listTasks({});

    const listOptions = http.get.mock.calls[0]?.[1] as { params: HttpParams };
    expect(listOptions.params.keys()).toEqual([]);
  });
});
