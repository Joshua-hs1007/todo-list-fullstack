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

describe('TaskListPage', () => {
  it('loads tasks on init and applies search filters', () => {
    const store = {
      tasks: signal<ApiTask[]>([]),
      error: signal<string | null>(null),
      loading: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
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

  it('passes reordered and deleted tasks to the store', async () => {
    const first = task('task-1');
    const second = task('task-2');
    const store = {
      tasks: signal<ApiTask[]>([first, second]),
      error: signal<string | null>(null),
      loading: signal(false),
      loadTasks: vi.fn(),
      setQuery: vi.fn(),
      reorderTasks: vi.fn(),
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

    page.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<ApiTask[]>);
    await page.deleteTask('task-1');

    expect(store.reorderTasks).toHaveBeenCalledWith([second, first]);
    expect(store.deleteTask).toHaveBeenCalledWith('task-1');
    expect(notifications.showSuccess).toHaveBeenCalledWith('Task deleted.');
  });
});
