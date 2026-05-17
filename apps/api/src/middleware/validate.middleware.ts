import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validateRequest(schemas: RequestSchemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      Object.defineProperty(request, 'params', {
        value: schemas.params.parse(request.params) as Request['params'],
        configurable: true,
      });
    }

    if (schemas.query) {
      Object.defineProperty(request, 'query', {
        value: schemas.query.parse(request.query) as Request['query'],
        configurable: true,
      });
    }

    next();
  };
}
