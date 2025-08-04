import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/constants';
import { JWTPayload } from '../types/jwt';

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.path.includes('/api/auth/')) {
        return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};
