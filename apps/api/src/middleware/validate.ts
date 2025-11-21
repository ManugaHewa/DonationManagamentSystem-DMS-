import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the body and replace it so downstream handlers can rely on the validated shape
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
