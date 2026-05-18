import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { NotificationService } from './core/notifications/notification.service';

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
          @if (signedInEmail(); as email) {
            <span class="signed-in-email" [title]="email">{{ email }}</span>
          }
          <button type="button" (click)="signOut()">Sign out</button>
        } @else {
          <a routerLink="/login" routerLinkActive="active">Sign in</a>
          <a routerLink="/register" routerLinkActive="active">Register</a>
        }
      </nav>
    </header>
    <main class="shell-main">
      <router-outlet />
    </main>

    @if (notifications.notification(); as notification) {
      <aside class="toast" role="status" aria-live="polite">
        <span>{{ notification.message }}</span>
        <button type="button" (click)="notifications.dismiss()" aria-label="Dismiss notification">
          Dismiss
        </button>
      </aside>
    }
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

      .signed-in-email {
        color: var(--muted);
        font-size: 0.9rem;
        font-weight: 650;
        max-width: min(240px, 34vw);
        overflow: hidden;
        padding: 0.5rem 0.4rem;
        text-overflow: ellipsis;
        white-space: nowrap;
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

      .toast {
        align-items: center;
        background: var(--success);
        border-radius: 8px;
        bottom: 1rem;
        box-shadow: var(--shadow-md);
        color: #ffffff;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        max-width: min(420px, calc(100vw - 2rem));
        padding: 0.85rem 1rem;
        position: fixed;
        right: 1rem;
        z-index: 20;
      }

      .toast button {
        background: rgb(255 255 255 / 14%);
        border: 1px solid rgb(255 255 255 / 35%);
        color: #ffffff;
        font-weight: 700;
        padding: 0.35rem 0.55rem;
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

        .toast {
          bottom: 0.75rem;
          left: 0.75rem;
          right: 0.75rem;
        }
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly signedInEmail = computed(() => this.auth.user()?.email ?? null);
  private readonly router = inject(Router);

  async signOut() {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
