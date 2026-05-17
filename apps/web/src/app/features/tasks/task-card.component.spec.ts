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
    component.delete.emit('task-1');
    expect(emit).toHaveBeenCalledWith('task-1');
  });
});
