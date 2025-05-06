export interface JWTPayload {
    userId: string;
    username: string;
    iat?: number;
    exp?: number;
}
