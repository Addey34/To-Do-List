import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
};
