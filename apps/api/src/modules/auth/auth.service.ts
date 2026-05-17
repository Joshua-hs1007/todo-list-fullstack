import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { Prisma } from '../../generated/prisma/index.js';

import { AppError } from '../../lib/errors.js';
import { signAccessToken } from '../../lib/jwt.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface AuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
}

function toAuthResult(user: { id: string; email: string }): AuthResult {
  return {
    token: signAccessToken({ userId: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export function createAuthService(database = prisma): AuthService {
  return {
    async register(input) {
      const email = input.email.trim().toLowerCase();
      const passwordHash = await hashPassword(input.password);

      try {
        const user = await database.user.create({
          data: {
            email,
            passwordHash,
          },
          select: {
            id: true,
            email: true,
          },
        });

        return toAuthResult(user);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(400, 'Email is already registered.', 'EMAIL_ALREADY_REGISTERED');
        }

        throw error;
      }
    },

    async login(input) {
      const email = input.email.trim().toLowerCase();
      const user = await database.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
        },
      });

      if (!user) {
        throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
      }

      const passwordMatches = await verifyPassword(input.password, user.passwordHash);

      if (!passwordMatches) {
        throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
      }

      return toAuthResult(user);
    },
  };
}

export const authService = createAuthService();
