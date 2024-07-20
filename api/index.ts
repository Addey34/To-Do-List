import bcrypt from 'bcrypt'; // Pour le hachage des mots de passe
import bodyParser from 'body-parser'; // Pour parser le corps des requêtes HTTP
import cors from 'cors'; // Pour gérer les Cross-Origin Resource Sharing
import dotenv from 'dotenv'; // Pour gérer les variables d'environnement
import express, { NextFunction, Request, Response } from 'express'; // Framework web
import helmet from 'helmet'; // Pour renforcer la sécurité des en-têtes HTTP
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'; // Pour gérer les JSON Web Tokens
import { MongoClient, ObjectId } from 'mongodb'; // Pour interagir avec MongoDB
import sanitizeHtml from 'sanitize-html'; // Pour nettoyer les entrées HTML

dotenv.config(); // Charger les variables d'environnement depuis un fichier .env

const app = express();
const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL as string; // URL de connexion MongoDB
const JWT_SECRET = process.env.JWT_SECRET as string; // Secret pour JWT
const PORT = process.env.PORT || 3000; // Port du serveur

async function start() {
    const client = new MongoClient(MONGO_CONNECT_URL);
    try {
        await client.connect(); // Connexion à MongoDB
        console.log('Connected to MongoDB');
        const db = client.db('TaskList'); // Sélection de la base de données

        // Middleware
        app.use(helmet()); // Sécurisation des en-têtes HTTP
        app.use(express.json({ limit: '1kb' })); // Limite de taille des requêtes JSON
        app.use(cors()); // Permettre les requêtes cross-origin
        app.use(bodyParser.json()); // Parser le corps des requêtes JSON

        // Fonction pour nettoyer les entrées utilisateur
        function sanitizeInput(input: string): string {
            return sanitizeHtml(input, {
                allowedTags: [],
                allowedAttributes: {},
            });
        }

        // Fonction pour valider le texte des tâches
        function validateTaskText(text: string): boolean {
            return (
                typeof text === 'string' &&
                text.length > 0 &&
                text.length <= 200
            );
        }

        // Middleware pour authentifier les tokens JWT
        function authenticateToken(
            req: Request,
            res: Response,
            next: NextFunction
        ) {
            const authHeader = req.headers['authorization'];
            console.log('Authorization Header:', authHeader);

            if (!authHeader) {
                console.error('Authorization header missing');
                return res.sendStatus(401); // Non autorisé si pas d'en-tête Authorization
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                console.error('Token missing in Authorization header');
                return res.sendStatus(401); // Non autorisé si pas de token
            }

            console.log('Token received:', token);

            jwt.verify(
                token,
                JWT_SECRET,
                { algorithms: ['HS256'] },
                (
                    err: VerifyErrors | null,
                    decoded: JwtPayload | string | undefined
                ) => {
                    if (err) {
                        console.error('JWT verification error:', err);
                        return res.sendStatus(403); // Interdit si token invalide
                    }
                    if (typeof decoded === 'string') {
                        console.error('Decoded token is a string:', decoded);
                        return res.sendStatus(403);
                    }
                    (req as any).user = decoded as JwtPayload;
                    console.log('User authenticated:', decoded);
                    next();
                }
            );
        }

        // Route de test pour vérifier si le serveur fonctionne
        app.get('/', (req: Request, res: Response) => {
            res.send('Express on Vercel');
        });

        // Route pour l'inscription des utilisateurs
        app.post('/register', async (req: Request, res: Response) => {
            const { username, password } = req.body;
            if (!username || !password) {
                return res
                    .status(400)
                    .json({ error: 'Username and password are required' });
            }
            try {
                const existingUser = await db
                    .collection('Users')
                    .findOne({ username });
                if (existingUser) {
                    return res
                        .status(400)
                        .json({ error: 'Username already exists' });
                }
                const hashedPassword = await bcrypt.hash(password, 10); // Hachage du mot de passe
                await db
                    .collection('Users')
                    .insertOne({ username, password: hashedPassword });
                res.status(201).json({
                    message: 'User registered successfully',
                });
            } catch (error) {
                console.error('Error registering user:', error);
                res.status(500).json({ error: 'Failed to register user' });
            }
        });

        // Route pour la connexion des utilisateurs
        app.post('/login', async (req: Request, res: Response) => {
            const { username, password } = req.body;
            try {
                const user = await db.collection('Users').findOne({ username });
                if (!user) {
                    return res
                        .status(400)
                        .json({ error: 'Invalid username or password' });
                }
                const isPasswordValid = await bcrypt.compare(
                    password,
                    user.password
                );
                if (!isPasswordValid) {
                    return res
                        .status(400)
                        .json({ error: 'Invalid username or password' });
                }
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

        // Route pour récupérer les tâches de l'utilisateur
        app.get(
            '/tasks',
            authenticateToken,
            async (req: Request, res: Response) => {
                try {
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

        // Route pour ajouter une nouvelle tâche
        app.post(
            '/tasks',
            authenticateToken,
            async (req: Request, res: Response) => {
                let { taskText } = req.body;
                taskText = sanitizeInput(taskText);
                if (!validateTaskText(taskText)) {
                    return res.status(400).json({ error: 'Invalid task text' });
                }
                const createdAt = new Date().toISOString();
                try {
                    const highestOrderTask = await db
                        .collection('Tasks')
                        .findOne(
                            { userId: (req as any).user.userId },
                            { sort: { order: -1 } }
                        );
                    const newOrder = highestOrderTask
                        ? highestOrderTask.order + 1
                        : 0;
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

        // Route pour mettre à jour une tâche existante
        app.put(
            '/tasks/:taskId',
            authenticateToken,
            async (req: Request, res: Response) => {
                const { taskId } = req.params;
                let { text } = req.body;
                text = sanitizeInput(text);
                if (!validateTaskText(text)) {
                    return res.status(400).json({ error: 'Invalid task text' });
                }
                try {
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

        // Route pour supprimer une tâche
        app.delete(
            '/tasks/:taskId',
            authenticateToken,
            async (req: Request, res: Response) => {
                const { taskId } = req.params;
                try {
                    const result = await db.collection('Tasks').deleteOne({
                        _id: new ObjectId(taskId),
                        userId: (req as any).user.userId,
                    });
                    if (result.deletedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Task not found' });
                    }
                    res.json({ message: 'Task deleted successfully' });
                } catch (error) {
                    console.error('Error deleting task:', error);
                    res.status(500).json({ error: 'Failed to delete task' });
                }
            }
        );

        // Route pour récupérer les tâches complétées de l'utilisateur
        app.get(
            '/completedTasks',
            authenticateToken,
            async (req: Request, res: Response) => {
                try {
                    const userId = (req as any).user.userId;
                    console.log('Fetching completed tasks for user:', userId);
                    const completedTasks = await db
                        .collection('CompletedTasks')
                        .find({ userId })
                        .toArray();
                    console.log('Completed tasks retrieved:', completedTasks);
                    res.json(completedTasks);
                } catch (error) {
                    console.error('Error retrieving completed tasks:', error);
                    res.status(500).json({
                        error: 'Failed to retrieve completed tasks',
                    });
                }
            }
        );

        // Route pour marquer une tâche comme complétée
        app.post(
            '/tasks/:taskId/complete',
            authenticateToken,
            async (req: Request, res: Response) => {
                const { taskId } = req.params;
                try {
                    const userId = (req as any).user.userId;
                    console.log(
                        'Completing task for user:',
                        userId,
                        'Task ID:',
                        taskId
                    );
                    const task = await db
                        .collection('Tasks')
                        .findOne({ _id: new ObjectId(taskId), userId });
                    if (!task) {
                        console.error('Task not found for user:', userId);
                        return res
                            .status(404)
                            .json({ error: 'Task not found' });
                    }
                    const result = await db
                        .collection('CompletedTasks')
                        .insertOne({
                            ...task,
                            completedAt: new Date().toISOString(),
                        });
                    console.log('Task marked as completed:', result.insertedId);
                    await db
                        .collection('Tasks')
                        .deleteOne({ _id: new ObjectId(taskId), userId });
                    res.json({ message: 'Task marked as completed' });
                } catch (error) {
                    console.error('Error marking task as completed:', error);
                    res.status(500).json({
                        error: 'Failed to mark task as completed',
                    });
                }
            }
        );

        // Route pour supprimer une tâche complétée
        app.delete(
            '/completedTasks/:completedTaskId',
            authenticateToken,
            async (req: Request, res: Response) => {
                const { completedTaskId } = req.params;
                try {
                    const result = await db
                        .collection('CompletedTasks')
                        .deleteOne({
                            _id: new ObjectId(completedTaskId),
                            userId: (req as any).user.userId,
                        });
                    if (result.deletedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Completed task not found' });
                    }
                    res.json({
                        message: 'Completed task deleted successfully',
                    });
                } catch (error) {
                    console.error('Error deleting completed task:', error);
                    res.status(500).json({
                        error: 'Failed to delete completed task',
                    });
                }
            }
        );

        // Route pour mettre à jour l'ordre des tâches
        app.put(
            '/tasks/:taskId/reorder',
            authenticateToken,
            async (req: Request, res: Response) => {
                const { taskId } = req.params;
                const { newIndex } = req.body;

                if (typeof newIndex !== 'number') {
                    return res.status(400).json({ error: 'Invalid newIndex' });
                }

                try {
                    const result = await db.collection('Tasks').updateOne(
                        {
                            _id: new ObjectId(taskId),
                            userId: (req as any).user.userId,
                        },
                        { $set: { order: newIndex } }
                    );

                    if (result.modifiedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Task not found or not modified' });
                    }

                    const tasks = await db
                        .collection('Tasks')
                        .find({ userId: (req as any).user.userId })
                        .sort({ order: 1 })
                        .toArray();
                    res.json(tasks);
                } catch (error) {
                    console.error('Error updating task order:', error);
                    res.status(500).json({
                        error: 'Failed to update task order',
                    });
                }
            }
        );

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

start();
