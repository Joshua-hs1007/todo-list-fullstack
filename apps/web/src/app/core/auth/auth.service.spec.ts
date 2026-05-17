import { Injector, runInInjectionContext } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient, type AuthResponse } from '../api/api-client';
import { AuthService } from './auth.service';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('AuthService', () => {
  let storage: MemoryStorage;
  let api: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };

  const response: AuthResponse = {
    token: 'token-1',
    user: { id: 'user-1', email: 'user@example.com' },
  };

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    api = {
      register: vi.fn(),
      login: vi.fn(),
    };
  });

  it('restores an existing session from local storage', () => {
    storage.setItem('todo.authToken', 'stored-token');
    storage.setItem('todo.user', JSON.stringify(response.user));

    const injector = Injector.create({ providers: [{ provide: ApiClient, useValue: api }] });
    const auth = runInInjectionContext(injector, () => new AuthService());

    expect(auth.token()).toBe('stored-token');
    expect(auth.user()).toEqual(response.user);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('ignores invalid stored user JSON', () => {
    storage.setItem('todo.user', '{invalid');
    const injector = Injector.create({ providers: [{ provide: ApiClient, useValue: api }] });
    const auth = runInInjectionContext(injector, () => new AuthService());

    expect(auth.user()).toBeNull();
  });

  it('persists login and registration responses', async () => {
    api.login.mockReturnValue(of(response));
    api.register.mockReturnValue(of({ ...response, token: 'token-2' }));
    const injector = Injector.create({ providers: [{ provide: ApiClient, useValue: api }] });
    const auth = runInInjectionContext(injector, () => new AuthService());

    await firstValueFrom(auth.login({ email: response.user.email, password: 'password123' }));
    expect(auth.token()).toBe('token-1');
    expect(storage.getItem('todo.authToken')).toBe('token-1');

    await firstValueFrom(auth.register({ email: response.user.email, password: 'password123' }));
    expect(auth.token()).toBe('token-2');
    expect(JSON.parse(storage.getItem('todo.user') ?? '{}')).toEqual(response.user);
  });

  it('clears the session on logout', () => {
    const injector = Injector.create({ providers: [{ provide: ApiClient, useValue: api }] });
    const auth = runInInjectionContext(injector, () => new AuthService());

    auth.setSession(response.token, response.user);
    auth.logout();

    expect(auth.token()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.getItem('todo.authToken')).toBeNull();
    expect(storage.getItem('todo.user')).toBeNull();
  });
});
