import { jest } from '@jest/globals';
import { Prisma } from '../src/generated/prisma/index.js';

import { hashPassword } from '../src/lib/password.js';
import type { AppError } from '../src/lib/errors.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';

type AuthDatabase = NonNullable<Parameters<typeof createAuthService>[0]>;

describe('authService', () => {
  it('registers a user with a normalized email and hashed password', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    const service = createAuthService({ user: { create } } as unknown as AuthDatabase);

    const result = await service.register({
      email: ' User@Example.COM ',
      password: 'password123',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com',
          passwordHash: expect.not.stringMatching('password123'),
        }),
      }),
    );
    expect(result.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(result.token).toEqual(expect.any(String));
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await hashPassword('password123');
    const findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
    });
    const service = createAuthService({ user: { findUnique } } as unknown as AuthDatabase);

    const result = await service.login({
      email: 'USER@example.com',
      password: 'password123',
    });

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'user@example.com' },
      }),
    );
    expect(result.user.email).toBe('user@example.com');
  });

  it('rejects invalid credentials', async () => {
    const service = createAuthService({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as AuthDatabase);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects an incorrect password without revealing which credential failed', async () => {
    const passwordHash = await hashPassword('password123');
    const service = createAuthService({
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          passwordHash,
        }),
      },
    } as unknown as AuthDatabase);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('maps duplicate email errors to a safe application error', async () => {
    const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const service = createAuthService({
      user: { create: jest.fn().mockRejectedValue(uniqueError) },
    } as unknown as AuthDatabase);

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  });

  it('rethrows unexpected registration failures', async () => {
    const error = new Error('database unavailable');
    const service = createAuthService({
      user: { create: jest.fn().mockRejectedValue(error) },
    } as unknown as AuthDatabase);

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toBe(error);
  });
});
