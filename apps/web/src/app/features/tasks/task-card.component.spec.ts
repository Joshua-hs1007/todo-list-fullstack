import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  it('formats status labels and emits delete events', () => {
    const component = runInInjectionContext(Injector.create({ providers: [] }), () => new TaskCardComponent());
    const emit = vi.spyOn(component.delete, 'emit');

    Object.defineProperty(component, 'task', {
      value: () => ({
        id: 'task-1',
        title: 'Task',
        status: 'IN_PROGRESS',
        position: 0,
      }),
    });

    expect(component.statusLabel).toBe('in progress');
    expect(component.statusClass).toBe('status status-in-progress');
    expect(component.formattedDueDate).toBe('');
    component.delete.emit('task-1');
    expect(emit).toHaveBeenCalledWith('task-1');
  });

  it('formats due dates when present', () => {
    const component = runInInjectionContext(Injector.create({ providers: [] }), () => new TaskCardComponent());

    Object.defineProperty(component, 'task', {
      value: () => ({
        id: 'task-1',
        title: 'Task',
        status: 'DONE',
        dueDate: '2026-05-18T00:00:00.000Z',
        position: 0,
      }),
    });

    expect(component.statusLabel).toBe('done');
    expect(component.statusClass).toBe('status status-done');
    expect(component.formattedDueDate).toMatch(/2026/);
  });
});
