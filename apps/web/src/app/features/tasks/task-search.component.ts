import { Component, DestroyRef, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import type { TaskStatusFilter } from './task.store';

@Component({
  selector: 'app-task-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="task-search" [formGroup]="form">
      <input type="search" formControlName="search" placeholder="Search tasks" />
      <select formControlName="status">
        <option value="">All statuses</option>
        <option value="TODO">To do</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="DONE">Done</option>
      </select>
    </form>
  `,
  styles: [
    `
      .task-search {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: minmax(0, 1fr) minmax(160px, 220px);
      }

      @media (max-width: 640px) {
        .task-search {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TaskSearchComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly queryChange = output<{ search: string; status: TaskStatusFilter }>();
  readonly form = this.formBuilder.nonNullable.group({
    search: [''],
    status: ['' as TaskStatusFilter],
  });

  constructor() {
    const subscription = this.form.valueChanges.pipe(debounceTime(250)).subscribe((value) => {
      this.queryChange.emit({
        search: value.search ?? '',
        status: value.status ?? '',
      });
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
