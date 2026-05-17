import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { TaskDetailPage } from './task-detail.page';
import { TaskStore } from './task.store';

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
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const injector = Injector.create({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
      },
      { provide: Router, useValue: router },
      { provide: TaskStore, useValue: store },
    ],
  });
  const page = runInInjectionContext(injector, () => new TaskDetailPage());

  return { page, router, store };
}

describe('TaskDetailPage', () => {
  it('clears selected task for new task routes', () => {
    const { page, store } = setup(null);

    page.ngOnInit();

    expect(page.isNew()).toBe(true);
    expect(store.clearSelectedTask).toHaveBeenCalled();
  });

  it('loads existing tasks and saves updates', async () => {
    const { page, router, store } = setup('task-1');

    page.ngOnInit();
    await page.save({ title: 'Updated' });

    expect(page.isNew()).toBe(false);
    expect(store.loadTask).toHaveBeenCalledWith('task-1');
    expect(store.updateTask).toHaveBeenCalledWith('task-1', { title: 'Updated' });
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'task-1']);
  });

  it('creates new tasks and stays put when saving fails', async () => {
    const { page, router, store } = setup(null);

    await page.save({ title: 'Task' });
    store.createTask.mockResolvedValueOnce(null);
    await page.save({ title: '' });

    expect(store.createTask).toHaveBeenCalledWith({ title: 'Task' });
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
});
