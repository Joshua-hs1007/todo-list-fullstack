import { Component, inject, input, output } from '@angular/core';
import type { OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ApiTask, TaskSaveInput } from '../../core/api/api-client';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="task-form" (ngSubmit)="submit()">
      <label>
        Title
        <input formControlName="title" />
      </label>
      <label>
        Description
        <textarea formControlName="description" rows="4"></textarea>
      </label>
      <label>
        Status
        <select formControlName="status">
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      </label>
      <label>
        Due date
        <input type="date" formControlName="dueDate" />
      </label>
      <button type="submit" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving...' : 'Save' }}
      </button>
    </form>
  `,
  styles: [
    `
      .task-form {
        display: grid;
        gap: 1rem;
        max-width: 560px;
      }

      label {
        display: grid;
        gap: 0.35rem;
      }
    `,
  ],
})
export class TaskFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  readonly task = input<ApiTask | null>(null);
  readonly saving = input(false);
  readonly save = output<TaskSaveInput>();

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['TODO' as ApiTask['status']],
    dueDate: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['task']) {
      const task = this.task();

      if (task) {
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        });
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      title: value.title,
      description: value.description || undefined,
      status: value.status,
      dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : undefined,
    });
  }
}
