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
      <div class="field field-full">
        <label for="task-title">Title</label>
        <input id="task-title" formControlName="title" placeholder="What needs to get done?" />
      </div>
      <div class="field field-full">
        <label for="task-description">Description</label>
        <textarea
          id="task-description"
          formControlName="description"
          rows="5"
          placeholder="Add context, acceptance notes, or links."
        ></textarea>
      </div>
      <div class="field">
        <label for="task-status">Status</label>
        <select id="task-status" formControlName="status">
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      <div class="field">
        <label for="task-due-date">Due date</label>
        <input id="task-due-date" type="date" formControlName="dueDate" />
      </div>
      <div class="form-actions field-full">
        <button type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save task' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .task-form {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        max-width: 760px;
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field-full {
        grid-column: 1 / -1;
      }

      label {
        color: var(--text);
        font-weight: 750;
      }

      .form-actions {
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: flex-end;
        padding-top: 1rem;
      }

      button {
        background: var(--primary);
        border: 1px solid var(--primary);
        color: #ffffff;
        font-weight: 750;
        min-height: 2.75rem;
        padding: 0.7rem 1rem;
      }

      button:hover:not(:disabled) {
        background: var(--primary-strong);
      }

      @media (max-width: 640px) {
        .task-form {
          grid-template-columns: 1fr;
        }

        .form-actions,
        button {
          width: 100%;
        }
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
