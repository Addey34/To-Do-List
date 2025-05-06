import { MongoClient } from 'mongodb';
import { CONFIG } from './constants';

export class DatabaseService {
    private static instance: DatabaseService;
    private client: MongoClient;

    private constructor() {
        const url = CONFIG.MONGO_URL;
        this.client = new MongoClient(url);
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public getClient(): MongoClient {
        return this.client;
    }

    async connect() {
        await this.client.connect();
        const db = this.client.db('TaskList');
        await db.collection('Tasks').createIndex({ userId: 1 });
        await db.collection('CompletedTasks').createIndex({ userId: 1 });
        return db;
    }

    async close() {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }
}
