import type { LoginInput, RegisterInput } from './auth.schemas.js';

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
