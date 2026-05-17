import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="shell-header">
      <a routerLink="/tasks" class="brand" aria-label="To Do List home">
        <span class="brand-mark">T</span>
        <span>Taskdesk</span>
      </a>
      <nav aria-label="Primary navigation">
        @if (auth.isAuthenticated()) {
          <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
          <button type="button" (click)="auth.logout()">Sign out</button>
        } @else {
          <a routerLink="/login" routerLinkActive="active">Sign in</a>
          <a routerLink="/register" routerLinkActive="active">Register</a>
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
        backdrop-filter: blur(16px);
        background: rgb(255 255 255 / 92%);
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        min-height: 68px;
        padding: 0.8rem clamp(1rem, 4vw, 3rem);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .brand {
        align-items: center;
        color: var(--text);
        display: inline-flex;
        gap: 0.65rem;
        font-weight: 700;
        letter-spacing: 0;
        text-decoration: none;
      }

      .brand-mark {
        align-items: center;
        background: var(--primary);
        border-radius: 6px;
        color: #ffffff;
        display: inline-flex;
        height: 2rem;
        justify-content: center;
        width: 2rem;
      }

      nav {
        align-items: center;
        display: flex;
        gap: 0.35rem;
      }

      nav a {
        border-radius: 6px;
        color: var(--muted);
        font-weight: 600;
        padding: 0.55rem 0.75rem;
        text-decoration: none;
      }

      nav a.active,
      nav a:hover {
        background: var(--surface-muted);
        color: var(--text);
      }

      nav button {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--muted);
        cursor: pointer;
        font-weight: 600;
        padding: 0.5rem 0.75rem;
      }

      .shell-main {
        margin: 0 auto;
        max-width: 1120px;
        padding: clamp(1.25rem, 3vw, 2.5rem) clamp(1rem, 4vw, 3rem) 3rem;
      }

      @media (max-width: 520px) {
        .shell-header {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.8rem;
        }

        nav {
          width: 100%;
        }
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
