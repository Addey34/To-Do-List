import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL;

if (!MONGO_CONNECT_URL) {
    console.error(
        'MONGO_CONNECT_URL is not defined in the environment variables'
    );
    process.exit(1);
}

const client = new MongoClient(MONGO_CONNECT_URL);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('TaskList');

        await db.command({ ping: 1 });
        console.log('Ping successful');
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        throw error; // Propagate the error
    }
}

// Function to close the connection
async function closeDatabaseConnection() {
    try {
        await client.close();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error closing MongoDB connection', error);
    }
}

// Export the connection function instead of immediately connecting
export { client, closeDatabaseConnection, connectToDatabase };
