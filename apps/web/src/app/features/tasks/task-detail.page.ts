import { Component } from '@angular/core';

import { TaskFormComponent } from './task-form.component';

@Component({
  standalone: true,
  imports: [TaskFormComponent],
  template: `
    <section>
      <h1>Task detail</h1>
      <app-task-form />
    </section>
  `
})
export class TaskDetailPage {}
