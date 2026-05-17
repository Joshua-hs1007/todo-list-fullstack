import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { login, me, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRoutes: ExpressRouter = Router();

authRoutes.post('/register', validateRequest({ body: registerSchema }), register);
authRoutes.post('/login', validateRequest({ body: loginSchema }), login);
authRoutes.get('/me', requireAuth, me);
