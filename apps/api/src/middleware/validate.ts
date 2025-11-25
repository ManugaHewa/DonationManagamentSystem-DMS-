import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the body and replace it so downstream handlers can rely on the validated shape
      const data = req.is('multipart/form-data') ? req.body : req.body;
      req.body = schema.parse(data);
      next();
    } catch (error) {
      next(error);
    }
  };
};
