import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import sanitizeHtml from 'sanitize-html';
import { closeDatabaseConnection, connectToDatabase } from './mongoClient';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET as string;
// const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json({ limit: '1kb' }));
app.use(cors());
app.use(bodyParser.json());

// Sanitize input
function sanitizeInput(input: string): string {
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},
    });
}

// Validate task text
function validateTaskText(text: string): boolean {
    return typeof text === 'string' && text.length > 0 && text.length <= 200;
}

// Authenticate token
function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(
        token,
        JWT_SECRET,
        { algorithms: ['HS256'] },
        (
            err: VerifyErrors | null,
            decoded: JwtPayload | string | undefined
        ) => {
            if (err) return res.sendStatus(403);
            if (typeof decoded === 'string') return res.sendStatus(403);
            (req as any).user = decoded as JwtPayload;
            next();
        }
    );
}

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Express on Vercel');
});

app.post('/api/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res
            .status(400)
            .json({ error: 'Username and password are required' });

    try {
        const db = await connectToDatabase();
        const existingUser = await db.collection('Users').findOne({ username });
        if (existingUser)
            return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db
            .collection('Users')
            .insertOne({ username, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

app.post('/api/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const db = await connectToDatabase();
        const user = await db.collection('Users').findOne({ username });
        if (!user)
            return res
                .status(400)
                .json({ error: 'Invalid username or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res
                .status(400)
                .json({ error: 'Invalid username or password' });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '1h',
            algorithm: 'HS256',
        });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

app.get(
    '/api/tasks',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const db = await connectToDatabase();
            const tasks = await db
                .collection('Tasks')
                .find({ userId: (req as any).user.userId })
                .sort({ order: 1 })
                .toArray();
            res.json(tasks);
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            res.status(500).json({ error: 'Failed to retrieve tasks' });
        }
    }
);

app.post(
    '/api/tasks',
    authenticateToken,
    async (req: Request, res: Response) => {
        let { taskText } = req.body;
        taskText = sanitizeInput(taskText);
        if (!validateTaskText(taskText))
            return res.status(400).json({ error: 'Invalid task text' });

        const createdAt = new Date().toISOString();

        try {
            const db = await connectToDatabase();
            const highestOrderTask = await db
                .collection('Tasks')
                .findOne(
                    { userId: (req as any).user.userId },
                    { sort: { order: -1 } }
                );
            const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

            const result = await db.collection('Tasks').insertOne({
                text: taskText,
                createdAt,
                order: newOrder,
                userId: (req as any).user.userId,
            });

            res.status(201).json({
                message: 'Task added successfully',
                taskId: result.insertedId,
            });
        } catch (error) {
            console.error('Error adding task:', error);
            res.status(500).json({ error: 'Failed to add task' });
        }
    }
);

app.put(
    '/api/tasks/:taskId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const { taskId } = req.params;
        let { text } = req.body;
        text = sanitizeInput(text);
        if (!validateTaskText(text))
            return res.status(400).json({ error: 'Invalid task text' });

        try {
            const db = await connectToDatabase();
            await db.collection('Tasks').updateOne(
                {
                    _id: new ObjectId(taskId),
                    userId: (req as any).user.userId,
                },
                { $set: { text: text } }
            );

            const tasks = await db
                .collection('Tasks')
                .find({ userId: (req as any).user.userId })
                .sort({ order: 1 })
                .toArray();
            res.json({ message: 'Task updated successfully', tasks });
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    }
);

app.delete(
    '/api/tasks/:taskId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const { taskId } = req.params;

        try {
            const db = await connectToDatabase();
            const result = await db.collection('Tasks').deleteOne({
                _id: new ObjectId(taskId),
                userId: (req as any).user.userId,
            });
            if (result.deletedCount === 0)
                return res.status(404).json({ error: 'Task not found' });

            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }
);

app.delete(
    '/api/completedTasks/:taskId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const { taskId } = req.params;

        try {
            const db = await connectToDatabase();
            const result = await db.collection('CompletedTasks').deleteOne({
                _id: new ObjectId(taskId),
                userId: (req as any).user.userId,
            });
            if (result.deletedCount === 0)
                return res
                    .status(404)
                    .json({ error: 'Completed task not found' });

            res.json({ message: 'Completed task deleted successfully' });
        } catch (error) {
            console.error('Error deleting completed task:', error);
            res.status(500).json({ error: 'Failed to delete completed task' });
        }
    }
);

app.get(
    '/api/completedTasks',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const db = await connectToDatabase();
            const completedTasks = await db
                .collection('CompletedTasks')
                .find({ userId: (req as any).user.userId })
                .toArray();
            res.json(completedTasks);
        } catch (error) {
            console.error('Error retrieving completed tasks:', error);
            res.status(500).json({
                error: 'Failed to retrieve completed tasks',
            });
        }
    }
);

app.post(
    '/api/tasks/:taskId/complete',
    authenticateToken,
    async (req: Request, res: Response) => {
        const { taskId } = req.params;

        try {
            const db = await connectToDatabase();
            const task = await db.collection('Tasks').findOne({
                _id: new ObjectId(taskId),
                userId: (req as any).user.userId,
            });
            if (!task) return res.status(404).json({ error: 'Task not found' });

            await db
                .collection('CompletedTasks')
                .insertOne({ ...task, completedAt: new Date().toISOString() });
            await db.collection('Tasks').deleteOne({
                _id: new ObjectId(taskId),
                userId: (req as any).user.userId,
            });

            res.json({ message: 'Task marked as complete' });
        } catch (error) {
            console.error('Error completing task:', error);
            res.status(500).json({ error: 'Failed to complete task' });
        }
    }
);

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(() => {
            console.log('⚡️[server]: Server is running');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await closeDatabaseConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await closeDatabaseConnection();
    process.exit(0);
});

app.listen(() => {
    console.log('Server is running');
});

export default app;
