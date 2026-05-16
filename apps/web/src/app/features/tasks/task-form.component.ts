import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="task-form">
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
      <button type="submit" [disabled]="form.invalid">Save</button>
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
    `
  ]
})
export class TaskFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['TODO' as const]
  });
}
