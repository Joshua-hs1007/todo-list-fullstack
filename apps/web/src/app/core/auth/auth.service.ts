import { Injectable, signal } from '@angular/core';

const tokenStorageKey = 'todo.authToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string | null>(globalThis.localStorage?.getItem(tokenStorageKey) ?? null);

  isAuthenticated() {
    return Boolean(this.token());
  }

  setToken(token: string) {
    globalThis.localStorage?.setItem(tokenStorageKey, token);
    this.token.set(token);
  }

  clearToken() {
    globalThis.localStorage?.removeItem(tokenStorageKey);
    this.token.set(null);
  }
}
