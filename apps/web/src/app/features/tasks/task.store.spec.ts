import { HttpErrorResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient, type ApiTask } from '../../core/api/api-client';
import { TaskStore } from './task.store';

const task = (overrides: Partial<ApiTask> = {}): ApiTask => ({
  id: 'task-1',
  title: 'Task',
  description: 'Description',
  status: 'TODO',
  position: 0,
  ...overrides,
});

describe('TaskStore', () => {
  let api: {
    listTasks: ReturnType<typeof vi.fn>;
    getTask: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    reorderTasks: ReturnType<typeof vi.fn>;
  };
  let store: TaskStore;

  beforeEach(() => {
    api = {
      listTasks: vi.fn(),
      getTask: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      reorderTasks: vi.fn(),
    };
    const injector = Injector.create({
      providers: [{ provide: ApiClient, useValue: api }],
    });
    store = runInInjectionContext(injector, () => new TaskStore());
  });

  it('loads tasks using the current search and status filters', async () => {
    const tasks = [task()];
    api.listTasks.mockReturnValue(of({ tasks }));
    store.setQuery({ search: 'invoice', status: 'TODO' });

    await store.loadTasks();

    expect(api.listTasks).toHaveBeenCalledWith({ search: 'invoice', status: 'TODO' });
    expect(store.tasks()).toEqual(tasks);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('exposes load task errors', async () => {
    api.listTasks.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 0,
          }),
      ),
    );

    await store.loadTasks();

    expect(store.error()).toBe('The API is unavailable.');
    expect(store.loading()).toBe(false);
  });

  it('loads and clears the selected task', async () => {
    const selected = task({ id: 'task-2' });
    api.getTask.mockReturnValue(of({ task: selected }));

    await store.loadTask('task-2');
    expect(api.getTask).toHaveBeenCalledWith('task-2');
    expect(store.selectedTask()).toEqual(selected);

    store.clearSelectedTask();
    expect(store.selectedTask()).toBeNull();
  });

  it('exposes selected task load errors', async () => {
    api.getTask.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { error: { message: 'Task was not found.' } },
          }),
      ),
    );

    await store.loadTask('missing-task');

    expect(store.selectedTask()).toBeNull();
    expect(store.error()).toBe('Task was not found.');
    expect(store.loading()).toBe(false);
  });

  it('creates and updates tasks through the save path', async () => {
    const created = task({ id: 'task-created' });
    const updated = task({ id: 'task-created', title: 'Updated' });
    api.createTask.mockReturnValue(of({ task: created }));
    api.updateTask.mockReturnValue(of({ task: updated }));

    await expect(store.createTask({ title: 'Task' })).resolves.toEqual(created);
    expect(store.selectedTask()).toEqual(created);

    await expect(store.updateTask('task-created', { title: 'Updated' })).resolves.toEqual(updated);
    expect(api.updateTask).toHaveBeenCalledWith('task-created', { title: 'Updated' });
    expect(store.selectedTask()).toEqual(updated);
  });

  it('removes deleted tasks from state', async () => {
    api.listTasks.mockReturnValue(of({ tasks: [task(), task({ id: 'task-2' })] }));
    api.deleteTask.mockReturnValue(of({ id: 'task-1' }));

    await store.loadTasks();
    await expect(store.deleteTask('task-1')).resolves.toBe(true);

    expect(api.deleteTask).toHaveBeenCalledWith('task-1');
    expect(store.tasks().map((item) => item.id)).toEqual(['task-2']);
  });

  it('keeps tasks and exposes an error when delete fails', async () => {
    const tasks = [task()];
    api.listTasks.mockReturnValue(of({ tasks }));
    api.deleteTask.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { error: { message: 'Forbidden' } },
          }),
      ),
    );

    await store.loadTasks();
    await expect(store.deleteTask('task-1')).resolves.toBe(false);

    expect(store.tasks()).toEqual(tasks);
    expect(store.error()).toBe('Forbidden');
    expect(store.saving()).toBe(false);
  });

  it('persists reorder requests and replaces state with the API response', async () => {
    const first = task({ id: 'task-1', position: 0 });
    const second = task({ id: 'task-2', position: 1 });
    api.reorderTasks.mockReturnValue(of({ tasks: [second, first] }));

    await store.reorderTasks([second, first]);

    expect(api.reorderTasks).toHaveBeenCalledWith(['task-2', 'task-1']);
    expect(store.tasks()).toEqual([second, first]);
    expect(store.saving()).toBe(false);
  });

  it('stores API errors and reloads tasks after failed reorder', async () => {
    const original = [task()];
    api.reorderTasks.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { error: { message: 'Forbidden' } },
          }),
      ),
    );
    api.listTasks.mockReturnValue(of({ tasks: original }));

    await store.reorderTasks([task({ id: 'task-2' })]);

    expect(store.error()).toBeNull();
    expect(api.listTasks).toHaveBeenCalledTimes(1);
    expect(store.tasks()).toEqual(original);
  });

  it('returns null and exposes an error when saving fails', async () => {
    api.createTask.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: { message: 'Validation failed' } },
          }),
      ),
    );

    await expect(store.createTask({ title: '' })).resolves.toBeNull();

    expect(store.error()).toBe('Validation failed');
    expect(store.saving()).toBe(false);
  });
});
