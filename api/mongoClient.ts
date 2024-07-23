import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL as string;

const client = new MongoClient(MONGO_CONNECT_URL);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('TaskList');

        await db.command({ ping: 1 });
        console.log('Ping successful');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}

connectToDatabase();

export { client };
