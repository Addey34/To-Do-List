import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { CONFIG } from './config/constants';
import { DatabaseService } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import completedTaskRoutes from './routes/completedTaskRoutes';
import taskRoutes from './routes/taskRoutes';

const app: Express = express();

// Middleware global
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    })
);

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/tasks', taskRoutes);
app.use('/api/completedTasks', completedTaskRoutes);

// Gestion des erreurs
app.use(errorHandler);

// Lancement du serveur
async function startServer() {
    try {
        const dbService = DatabaseService.getInstance();
        await dbService.connect();
        app.listen(CONFIG.PORT, () => {
            console.log(
                `⚡️[server]: Server is running on port ${CONFIG.PORT}`
            );
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Gestion des signaux système
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await DatabaseService.getInstance().close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await DatabaseService.getInstance().close();
    process.exit(0);
});

startServer();

export default app;
