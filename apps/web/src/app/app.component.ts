import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="shell-header">
      <a routerLink="/tasks" class="brand">To Do List</a>
      <nav>
        @if (auth.isAuthenticated()) {
          <a routerLink="/tasks">Tasks</a>
          <button type="button" (click)="auth.logout()">Sign out</button>
        } @else {
          <a routerLink="/login">Sign in</a>
          <a routerLink="/register">Register</a>
        }
      </nav>
    </header>
    <main class="shell-main">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .shell-header {
        align-items: center;
        background: #ffffff;
        border-bottom: 1px solid #d8deea;
        display: flex;
        justify-content: space-between;
        padding: 1rem clamp(1rem, 4vw, 3rem);
      }

      .brand {
        color: #172033;
        font-weight: 700;
        text-decoration: none;
      }

      nav {
        display: flex;
        gap: 1rem;
      }

      nav a {
        color: #315274;
        text-decoration: none;
      }

      nav button {
        background: transparent;
        border: 0;
        color: #315274;
        cursor: pointer;
        padding: 0;
      }

      .shell-main {
        margin: 0 auto;
        max-width: 960px;
        padding: 2rem clamp(1rem, 4vw, 3rem);
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
