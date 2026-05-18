import { Injector, runInInjectionContext, signal } from '@angular/core';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { describe, expect, it, vi } from 'vitest';

import type { ApiTask } from '../../core/api/api-client';
import { NotificationService } from '../../core/notifications/notification.service';
import { TaskListPage } from './task-list.page';
import { TaskStore } from './task.store';

const task = (id: string): ApiTask => ({
  id,
  title: id,
  status: 'TODO',
  position: 0,
});

const setup = (tasks: ApiTask[] = [], deleteTask = vi.fn().mockResolvedValue(true)) => {
  const store = {
    tasks: signal<ApiTask[]>(tasks),
    error: signal<string | null>(null),
    loading: signal(false),
    saving: signal(false),
    loadTasks: vi.fn(),
    setQuery: vi.fn(),
    reorderTasks: vi.fn(),
    updateTask: vi.fn().mockResolvedValue(task('updated-task')),
    deleteTask,
  };
  const notifications = { showSuccess: vi.fn() };
  const injector = Injector.create({
    providers: [
      { provide: TaskStore, useValue: store },
      { provide: NotificationService, useValue: notifications },
    ],
  });
  const page = runInInjectionContext(injector, () => new TaskListPage());

  return { notifications, page, store };
};

describe('TaskListPage', () => {
  it('loads tasks on init and applies search filters', () => {
    const store = {
      tasks: signal<ApiTask[]>([]),
      error: signal<string | null>(null),
      loading: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    };
    const injector = Injector.create({
      providers: [
        { provide: TaskStore, useValue: store },
        { provide: NotificationService, useValue: { showSuccess: vi.fn() } },
      ],
    });
    const page = runInInjectionContext(injector, () => new TaskListPage());

    page.ngOnInit();
    page.search({ search: 'invoice', status: 'DONE' });

    expect(store.loadTasks).toHaveBeenCalledTimes(2);
    expect(store.setQuery).toHaveBeenCalledWith({ search: 'invoice', status: 'DONE' });
  });

  it('computes task summary counts by status', () => {
    const { page } = setup([
      task('task-1'),
      task('task-4'),
      { ...task('task-2'), status: 'IN_PROGRESS' },
      { ...task('task-3'), status: 'DONE' },
    ]);

    expect(page.totalTasks()).toBe(4);
    expect(page.todoTaskCount()).toBe(2);
    expect(page.todoTaskItems()).toHaveLength(2);
    expect(page.inProgressTaskItems()).toHaveLength(1);
    expect(page.doneTaskItems()).toHaveLength(1);
    expect(page.inProgressTasks()).toBe(1);
    expect(page.doneTasks()).toBe(1);
  });

  it('passes same-column reordered tasks to the store and opens delete confirmation', async () => {
    const first = task('task-1');
    const second = task('task-2');
    const store = {
      tasks: signal<ApiTask[]>([first, second]),
      error: signal<string | null>(null),
      loading: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn().mockResolvedValue(true),
    };
    const notifications = { showSuccess: vi.fn() };
    const injector = Injector.create({
      providers: [
        { provide: TaskStore, useValue: store },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const page = runInInjectionContext(injector, () => new TaskListPage());

    await page.drop(
      {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: first },
      } as CdkDragDrop<ApiTask[]>,
      'TODO',
    );
    page.requestDelete('task-1');

    expect(store.reorderTasks).toHaveBeenCalledWith([second, first]);
    expect(store.updateTask).not.toHaveBeenCalled();
    expect(page.pendingDeleteTask()).toEqual(first);
    expect(store.deleteTask).not.toHaveBeenCalled();
    expect(notifications.showSuccess).not.toHaveBeenCalled();
  });

  it('updates status and order when a task moves to another column', async () => {
    const todo = task('task-1');
    const inProgress = { ...task('task-2'), status: 'IN_PROGRESS' as const };
    const { page, store } = setup([todo, inProgress]);

    await page.drop(
      {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: todo },
      } as CdkDragDrop<ApiTask[]>,
      'IN_PROGRESS',
    );

    expect(store.updateTask).toHaveBeenCalledWith('task-1', {
      title: 'task-1',
      description: undefined,
      dueDate: undefined,
      status: 'IN_PROGRESS',
    });
    expect(store.reorderTasks).toHaveBeenCalledWith([
      inProgress,
      { ...todo, status: 'IN_PROGRESS' },
    ]);
  });

  it('reloads tasks without reordering when a cross-column status update fails', async () => {
    const todo = task('task-1');
    const { page, store } = setup([todo]);
    store.updateTask.mockResolvedValueOnce(null);

    await page.drop(
      {
        previousIndex: 0,
        currentIndex: 0,
        item: { data: todo },
      } as CdkDragDrop<ApiTask[]>,
      'DONE',
    );

    expect(store.updateTask).toHaveBeenCalledWith('task-1', {
      title: 'task-1',
      description: undefined,
      dueDate: undefined,
      status: 'DONE',
    });
    expect(store.loadTasks).toHaveBeenCalledTimes(1);
    expect(store.reorderTasks).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation and shows a notification', async () => {
    const first = task('task-1');
    const store = {
      tasks: signal<ApiTask[]>([first]),
      error: signal<string | null>(null),
      loading: signal(false),
      saving: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn().mockResolvedValue(true),
    };
    const notifications = { showSuccess: vi.fn() };
    const injector = Injector.create({
      providers: [
        { provide: TaskStore, useValue: store },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const page = runInInjectionContext(injector, () => new TaskListPage());

    page.requestDelete('task-1');
    await page.confirmDelete();

    expect(store.deleteTask).toHaveBeenCalledWith('task-1');
    expect(page.pendingDeleteTask()).toBeNull();
    expect(notifications.showSuccess).toHaveBeenCalledWith('Task deleted.');
  });

  it('cancels delete confirmation without calling the store', () => {
    const first = task('task-1');
    const store = {
      tasks: signal<ApiTask[]>([first]),
      error: signal<string | null>(null),
      loading: signal(false),
      saving: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    };
    const injector = Injector.create({
      providers: [
        { provide: TaskStore, useValue: store },
        { provide: NotificationService, useValue: { showSuccess: vi.fn() } },
      ],
    });
    const page = runInInjectionContext(injector, () => new TaskListPage());

    page.requestDelete('task-1');
    page.cancelDelete();

    expect(page.pendingDeleteTask()).toBeNull();
    expect(store.deleteTask).not.toHaveBeenCalled();
  });

  it('ignores delete requests for unknown tasks', () => {
    const first = task('task-1');
    const { page, store } = setup([first]);

    page.requestDelete('missing-task');

    expect(page.pendingDeleteTask()).toBeNull();
    expect(store.deleteTask).not.toHaveBeenCalled();
  });

  it('does nothing when confirming without a pending task', async () => {
    const { notifications, page, store } = setup([task('task-1')]);

    await page.confirmDelete();

    expect(store.deleteTask).not.toHaveBeenCalled();
    expect(notifications.showSuccess).not.toHaveBeenCalled();
  });

  it('keeps the confirmation open when delete fails', async () => {
    const first = task('task-1');
    const { notifications, page, store } = setup([first], vi.fn().mockResolvedValue(false));

    page.requestDelete('task-1');
    await page.confirmDelete();

    expect(store.deleteTask).toHaveBeenCalledWith('task-1');
    expect(page.pendingDeleteTask()).toEqual(first);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
  });
});
