import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="shell-header">
      <a routerLink="/tasks" class="brand">To Do List</a>
      <nav>
        <a routerLink="/sign-in">Sign in</a>
        <a routerLink="/register">Register</a>
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

      .shell-main {
        margin: 0 auto;
        max-width: 960px;
        padding: 2rem clamp(1rem, 4vw, 3rem);
      }
    `
  ]
})
export class AppComponent {}
