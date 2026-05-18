import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { TaskDetailPage } from './task-detail.page';
import { TaskStore } from './task.store';
import { NotificationService } from '../../core/notifications/notification.service';

function setup(id: string | null) {
  const task = { id: 'task-1', title: 'Task', status: 'TODO' as const, position: 0 };
  const store = {
    loading: signal(false),
    error: signal<string | null>(null),
    saving: signal(false),
    selectedTask: signal(null),
    loadTask: vi.fn().mockResolvedValue(undefined),
    clearSelectedTask: vi.fn(),
    createTask: vi.fn().mockResolvedValue(task),
    updateTask: vi.fn().mockResolvedValue(task),
    deleteTask: vi.fn().mockResolvedValue(true),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const notifications = { showSuccess: vi.fn() };
  const injector = Injector.create({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(id ? { id } : {}),
            queryParamMap: convertToParamMap({}),
          },
        },
      },
      { provide: Router, useValue: router },
      { provide: TaskStore, useValue: store },
      { provide: NotificationService, useValue: notifications },
    ],
  });
  const page = runInInjectionContext(injector, () => new TaskDetailPage());

  return { notifications, page, router, store };
}

function setupEditRoute() {
  const context = setup('task-1');
  const route = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'task-1' }),
      queryParamMap: convertToParamMap({ edit: 'true' }),
    },
  };
  const injector = Injector.create({
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: context.router },
      { provide: TaskStore, useValue: context.store },
      { provide: NotificationService, useValue: context.notifications },
    ],
  });

  return { ...context, page: runInInjectionContext(injector, () => new TaskDetailPage()) };
}

describe('TaskDetailPage', () => {
  it('clears selected task for new task routes', () => {
    const { page, store } = setup(null);

    page.ngOnInit();

    expect(page.isNew()).toBe(true);
    expect(store.clearSelectedTask).toHaveBeenCalled();
  });

  it('loads existing tasks and saves updates', async () => {
    const { notifications, page, router, store } = setup('task-1');

    page.ngOnInit();
    page.startEditing();
    await page.save({ title: 'Updated' });

    expect(page.isNew()).toBe(false);
    expect(page.isEditing()).toBe(false);
    expect(store.loadTask).toHaveBeenCalledWith('task-1');
    expect(store.updateTask).toHaveBeenCalledWith('task-1', { title: 'Updated' });
    expect(notifications.showSuccess).toHaveBeenCalledWith('Task updated.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('creates new tasks and stays put when saving fails', async () => {
    const { notifications, page, router, store } = setup(null);

    await page.save({ title: 'Task' });
    store.createTask.mockResolvedValueOnce(null);
    await page.save({ title: '' });

    expect(store.createTask).toHaveBeenCalledWith({ title: 'Task' });
    expect(notifications.showSuccess).toHaveBeenCalledWith('Task created.');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('opens existing tasks in edit mode from the edit action route', () => {
    const { page, store } = setupEditRoute();

    page.ngOnInit();

    expect(page.isEditing()).toBe(true);
    expect(store.loadTask).toHaveBeenCalledWith('task-1');
  });

  it('deletes an existing task after confirmation', async () => {
    const { notifications, page, router, store } = setup('task-1');

    page.requestDelete('task-1');
    await page.confirmDelete();

    expect(store.deleteTask).toHaveBeenCalledWith('task-1');
    expect(page.pendingDeleteTaskId()).toBeNull();
    expect(notifications.showSuccess).toHaveBeenCalledWith('Task deleted.');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('cancels and ignores empty delete confirmations', async () => {
    const { notifications, page, router, store } = setup('task-1');

    page.requestDelete('task-1');
    page.cancelDelete();
    await page.confirmDelete();

    expect(page.pendingDeleteTaskId()).toBeNull();
    expect(store.deleteTask).not.toHaveBeenCalled();
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
