import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TaskSearchComponent } from './task-search.component';

describe('TaskSearchComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces query changes', () => {
    vi.useFakeTimers();
    const injector = Injector.create({
      providers: [FormBuilder],
    });
    const component = runInInjectionContext(injector, () => new TaskSearchComponent());
    const emit = vi.spyOn(component.queryChange, 'emit');

    component.form.setValue({ search: 'invoice', status: 'DONE' });
    vi.advanceTimersByTime(249);
    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(emit).toHaveBeenCalledWith({ search: 'invoice', status: 'DONE' });

    const destroyable = injector as Injector & { destroy: () => void };
    destroyable.destroy();
    component.form.setValue({ search: 'ignored', status: '' });
    vi.advanceTimersByTime(250);
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
