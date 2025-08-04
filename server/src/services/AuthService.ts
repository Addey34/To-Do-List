import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/constants';
import { DatabaseService } from '../config/database';
import { IUser } from '../models/User';
import { AppError } from '../utils/errorTypes';

export class AuthService {
    private db = DatabaseService.getInstance();

    async register(username: string, password: string) {
        const database = await this.db.connect();
        const collection = database.collection<IUser>('Users');
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            throw new AppError('Username already exists', 400);
        }
        const hashedPassword = await bcrypt.hash(
            password,
            CONFIG.PASSWORD_SALT_ROUNDS
        );
        const result = await collection.insertOne({
            username,
            password: hashedPassword,
        });
        return {
            userId: result.insertedId,
            message: 'User registered successfully',
        };
    }

    async login(username: string, password: string) {
        const database = await this.db.connect();
        const collection = database.collection<IUser>('Users');
        const user = await collection.findOne({ username });
        if (!user) {
            throw new AppError('Invalid username or password', 401);
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new AppError('Invalid username or password', 401);
        }
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
            },
            CONFIG.JWT_SECRET as string,
            {
                expiresIn: '1h',
                algorithm: 'HS256',
            }
        );

        return { token };
    }
}
