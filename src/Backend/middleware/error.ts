import { NextFunction, Request, Response } from "express";
import { log } from "../utils/logger";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError("Not found", 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const message = isAppError ? err.message : "Internal server error";

  if (!isAppError) {
    log.error("Unexpected error:", err);
  }

  res.status(status).json({ ok: false, error: { message, status } });
}
