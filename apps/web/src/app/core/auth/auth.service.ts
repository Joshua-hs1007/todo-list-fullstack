import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

import { ApiClient, type ApiUser } from '../api/api-client';

const tokenStorageKey = 'todo.authToken';
const userStorageKey = 'todo.user';

function readToken() {
  return globalThis.localStorage?.getItem(tokenStorageKey) ?? null;
}

function readUser() {
  const rawUser = globalThis.localStorage?.getItem(userStorageKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as ApiUser;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);

  readonly token = signal<string | null>(readToken());
  readonly user = signal<ApiUser | null>(readUser());
  readonly isAuthenticated = computed(() => Boolean(this.token()));

  register(input: { email: string; password: string }) {
    return this.api.register(input).pipe(
      tap((response) => {
        this.setSession(response.token, response.user);
      }),
    );
  }

  login(input: { email: string; password: string }) {
    return this.api.login(input).pipe(
      tap((response) => {
        this.setSession(response.token, response.user);
      }),
    );
  }

  setSession(token: string, user: ApiUser) {
    globalThis.localStorage?.setItem(tokenStorageKey, token);
    globalThis.localStorage?.setItem(userStorageKey, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
  }

  logout() {
    globalThis.localStorage?.removeItem(tokenStorageKey);
    globalThis.localStorage?.removeItem(userStorageKey);
    this.token.set(null);
    this.user.set(null);
  }
}
