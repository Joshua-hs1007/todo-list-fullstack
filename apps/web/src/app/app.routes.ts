import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { RegisterPage } from './features/auth/register.page';
import { SignInPage } from './features/auth/sign-in.page';
import { TaskDetailPage } from './features/tasks/task-detail.page';
import { TaskListPage } from './features/tasks/task-list.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: 'sign-in', component: SignInPage },
  { path: 'register', component: RegisterPage },
  { path: 'tasks', component: TaskListPage, canActivate: [authGuard] },
  { path: 'tasks/:id', component: TaskDetailPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'tasks' }
];
