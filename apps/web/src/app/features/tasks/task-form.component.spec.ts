import { FormBuilder } from '@angular/forms';
import { Injector, runInInjectionContext } from '@angular/core';
import type { SimpleChange } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
  it('marks the title as required and does not emit invalid forms', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());
    const emit = vi.spyOn(component.save, 'emit');

    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(emit).not.toHaveBeenCalled();
  });

  it('emits normalized save input for valid forms', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());
    const emit = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      title: 'Task',
      description: '',
      status: 'DONE',
      dueDate: '2026-06-01',
    });
    component.submit();

    expect(emit).toHaveBeenCalledWith({
      title: 'Task',
      description: undefined,
      status: 'DONE',
      dueDate: new Date('2026-06-01').toISOString(),
    });
  });

  it('patches form values when an existing task input changes', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());

    Object.defineProperty(component, 'task', {
      value: () => ({
        id: 'task-1',
        title: 'Existing',
        description: null,
        status: 'IN_PROGRESS',
        dueDate: '2026-06-01T00:00:00.000Z',
        position: 0,
      }),
    });
    component.ngOnChanges({ task: {} as SimpleChange });

    expect(component.form.getRawValue()).toEqual({
      title: 'Existing',
      description: '',
      status: 'IN_PROGRESS',
      dueDate: '2026-06-01',
    });
  });

  it('handles existing tasks without optional fields', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());

    Object.defineProperty(component, 'task', {
      value: () => ({
        id: 'task-1',
        title: 'Existing',
        description: 'Body',
        status: 'TODO',
        dueDate: undefined,
        position: 0,
      }),
    });
    component.ngOnChanges({ task: {} as SimpleChange });

    expect(component.form.getRawValue()).toEqual({
      title: 'Existing',
      description: 'Body',
      status: 'TODO',
      dueDate: '',
    });
  });

  it('does not patch when the task input is empty', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());

    Object.defineProperty(component, 'task', {
      value: () => null,
    });
    component.ngOnChanges({ task: {} as SimpleChange });

    expect(component.form.getRawValue().title).toBe('');
  });

  it('ignores unrelated input changes', () => {
    const injector = Injector.create({ providers: [FormBuilder] });
    const component = runInInjectionContext(injector, () => new TaskFormComponent());

    component.ngOnChanges({ saving: {} as SimpleChange });

    expect(component.form.getRawValue().title).toBe('');
  });
});
