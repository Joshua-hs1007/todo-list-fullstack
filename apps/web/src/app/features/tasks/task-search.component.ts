import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="task-search">
      <input type="search" name="search" placeholder="Search tasks" />
      <select name="status">
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
    `
  ]
})
export class TaskSearchComponent {}
