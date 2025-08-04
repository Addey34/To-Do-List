import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET as string,
    PORT: process.env.PORT || (5500 as number),
    MONGO_URL: process.env.MONGO_CONNECT_URL as string,
    JWT_EXPIRES_IN: '1h' as const,
    PASSWORD_SALT_ROUNDS: 10 as number,
};
