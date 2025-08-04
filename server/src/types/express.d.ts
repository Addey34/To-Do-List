import { JWTPayload } from './jwt';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
