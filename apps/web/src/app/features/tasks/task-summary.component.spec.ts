import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { TaskSummaryComponent } from './task-summary.component';

describe('TaskSummaryComponent', () => {
  it('defines required count inputs', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new TaskSummaryComponent());

    expect(component.total).toBeDefined();
    expect(component.todo).toBeDefined();
    expect(component.inProgress).toBeDefined();
    expect(component.done).toBeDefined();
  });
});
