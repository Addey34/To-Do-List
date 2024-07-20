"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt")); // Pour le hachage des mots de passe
const body_parser_1 = __importDefault(require("body-parser")); // Pour parser le corps des requêtes HTTP
const cors_1 = __importDefault(require("cors")); // Pour gérer les Cross-Origin Resource Sharing
const dotenv_1 = __importDefault(require("dotenv")); // Pour gérer les variables d'environnement
const express_1 = __importDefault(require("express")); // Framework web
const helmet_1 = __importDefault(require("helmet")); // Pour renforcer la sécurité des en-têtes HTTP
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Pour gérer les JSON Web Tokens
const mongodb_1 = require("mongodb"); // Pour interagir avec MongoDB
const sanitize_html_1 = __importDefault(require("sanitize-html")); // Pour nettoyer les entrées HTML
dotenv_1.default.config(); // Charger les variables d'environnement depuis un fichier .env
const app = (0, express_1.default)();
const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL; // URL de connexion MongoDB
const JWT_SECRET = process.env.JWT_SECRET; // Secret pour JWT
const PORT = process.env.PORT || 3000; // Port du serveur
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongodb_1.MongoClient(MONGO_CONNECT_URL);
        try {
            yield client.connect(); // Connexion à MongoDB
            console.log('Connected to MongoDB');
            const db = client.db('TaskList'); // Sélection de la base de données
            // Middleware
            app.use((0, helmet_1.default)()); // Sécurisation des en-têtes HTTP
            app.use(express_1.default.json({ limit: '1kb' })); // Limite de taille des requêtes JSON
            app.use((0, cors_1.default)()); // Permettre les requêtes cross-origin
            app.use(body_parser_1.default.json()); // Parser le corps des requêtes JSON
            // Fonction pour nettoyer les entrées utilisateur
            function sanitizeInput(input) {
                return (0, sanitize_html_1.default)(input, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
            }
            // Fonction pour valider le texte des tâches
            function validateTaskText(text) {
                return (typeof text === 'string' &&
                    text.length > 0 &&
                    text.length <= 200);
            }
            // Middleware pour authentifier les tokens JWT
            function authenticateToken(req, res, next) {
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
                jsonwebtoken_1.default.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
                    if (err) {
                        console.error('JWT verification error:', err);
                        return res.sendStatus(403); // Interdit si token invalide
                    }
                    if (typeof decoded === 'string') {
                        console.error('Decoded token is a string:', decoded);
                        return res.sendStatus(403);
                    }
                    req.user = decoded;
                    console.log('User authenticated:', decoded);
                    next();
                });
            }
            // Route de test pour vérifier si le serveur fonctionne
            app.get('/', (req, res) => {
                res.send('Express on Vercel');
            });
            // Route pour l'inscription des utilisateurs
            app.post('/register', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { username, password } = req.body;
                if (!username || !password) {
                    return res
                        .status(400)
                        .json({ error: 'Username and password are required' });
                }
                try {
                    const existingUser = yield db
                        .collection('Users')
                        .findOne({ username });
                    if (existingUser) {
                        return res
                            .status(400)
                            .json({ error: 'Username already exists' });
                    }
                    const hashedPassword = yield bcrypt_1.default.hash(password, 10); // Hachage du mot de passe
                    yield db
                        .collection('Users')
                        .insertOne({ username, password: hashedPassword });
                    res.status(201).json({
                        message: 'User registered successfully',
                    });
                }
                catch (error) {
                    console.error('Error registering user:', error);
                    res.status(500).json({ error: 'Failed to register user' });
                }
            }));
            // Route pour la connexion des utilisateurs
            app.post('/login', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { username, password } = req.body;
                try {
                    const user = yield db.collection('Users').findOne({ username });
                    if (!user) {
                        return res
                            .status(400)
                            .json({ error: 'Invalid username or password' });
                    }
                    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                    if (!isPasswordValid) {
                        return res
                            .status(400)
                            .json({ error: 'Invalid username or password' });
                    }
                    const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
                        expiresIn: '1h',
                        algorithm: 'HS256',
                    });
                    res.json({ token });
                }
                catch (error) {
                    console.error('Error logging in:', error);
                    res.status(500).json({ error: 'Failed to log in' });
                }
            }));
            // Route pour récupérer les tâches de l'utilisateur
            app.get('/tasks', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const tasks = yield db
                        .collection('Tasks')
                        .find({ userId: req.user.userId })
                        .sort({ order: 1 })
                        .toArray();
                    res.json(tasks);
                }
                catch (error) {
                    console.error('Error retrieving tasks:', error);
                    res.status(500).json({ error: 'Failed to retrieve tasks' });
                }
            }));
            // Route pour ajouter une nouvelle tâche
            app.post('/tasks', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                let { taskText } = req.body;
                taskText = sanitizeInput(taskText);
                if (!validateTaskText(taskText)) {
                    return res.status(400).json({ error: 'Invalid task text' });
                }
                const createdAt = new Date().toISOString();
                try {
                    const highestOrderTask = yield db
                        .collection('Tasks')
                        .findOne({ userId: req.user.userId }, { sort: { order: -1 } });
                    const newOrder = highestOrderTask
                        ? highestOrderTask.order + 1
                        : 0;
                    const result = yield db.collection('Tasks').insertOne({
                        text: taskText,
                        createdAt,
                        order: newOrder,
                        userId: req.user.userId,
                    });
                    res.status(201).json({
                        message: 'Task added successfully',
                        taskId: result.insertedId,
                    });
                }
                catch (error) {
                    console.error('Error adding task:', error);
                    res.status(500).json({ error: 'Failed to add task' });
                }
            }));
            // Route pour mettre à jour une tâche existante
            app.put('/tasks/:taskId', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { taskId } = req.params;
                let { text } = req.body;
                text = sanitizeInput(text);
                if (!validateTaskText(text)) {
                    return res.status(400).json({ error: 'Invalid task text' });
                }
                try {
                    yield db.collection('Tasks').updateOne({
                        _id: new mongodb_1.ObjectId(taskId),
                        userId: req.user.userId,
                    }, { $set: { text: text } });
                    const tasks = yield db
                        .collection('Tasks')
                        .find({ userId: req.user.userId })
                        .sort({ order: 1 })
                        .toArray();
                    res.json({ message: 'Task updated successfully', tasks });
                }
                catch (error) {
                    console.error('Error updating task:', error);
                    res.status(500).json({ error: 'Failed to update task' });
                }
            }));
            // Route pour supprimer une tâche
            app.delete('/tasks/:taskId', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { taskId } = req.params;
                try {
                    const result = yield db.collection('Tasks').deleteOne({
                        _id: new mongodb_1.ObjectId(taskId),
                        userId: req.user.userId,
                    });
                    if (result.deletedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Task not found' });
                    }
                    res.json({ message: 'Task deleted successfully' });
                }
                catch (error) {
                    console.error('Error deleting task:', error);
                    res.status(500).json({ error: 'Failed to delete task' });
                }
            }));
            // Route pour récupérer les tâches complétées de l'utilisateur
            app.get('/completedTasks', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const userId = req.user.userId;
                    console.log('Fetching completed tasks for user:', userId);
                    const completedTasks = yield db
                        .collection('CompletedTasks')
                        .find({ userId })
                        .toArray();
                    console.log('Completed tasks retrieved:', completedTasks);
                    res.json(completedTasks);
                }
                catch (error) {
                    console.error('Error retrieving completed tasks:', error);
                    res.status(500).json({
                        error: 'Failed to retrieve completed tasks',
                    });
                }
            }));
            // Route pour marquer une tâche comme complétée
            app.post('/tasks/:taskId/complete', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { taskId } = req.params;
                try {
                    const userId = req.user.userId;
                    console.log('Completing task for user:', userId, 'Task ID:', taskId);
                    const task = yield db
                        .collection('Tasks')
                        .findOne({ _id: new mongodb_1.ObjectId(taskId), userId });
                    if (!task) {
                        console.error('Task not found for user:', userId);
                        return res
                            .status(404)
                            .json({ error: 'Task not found' });
                    }
                    const result = yield db
                        .collection('CompletedTasks')
                        .insertOne(Object.assign(Object.assign({}, task), { completedAt: new Date().toISOString() }));
                    console.log('Task marked as completed:', result.insertedId);
                    yield db
                        .collection('Tasks')
                        .deleteOne({ _id: new mongodb_1.ObjectId(taskId), userId });
                    res.json({ message: 'Task marked as completed' });
                }
                catch (error) {
                    console.error('Error marking task as completed:', error);
                    res.status(500).json({
                        error: 'Failed to mark task as completed',
                    });
                }
            }));
            // Route pour supprimer une tâche complétée
            app.delete('/completedTasks/:completedTaskId', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { completedTaskId } = req.params;
                try {
                    const result = yield db
                        .collection('CompletedTasks')
                        .deleteOne({
                        _id: new mongodb_1.ObjectId(completedTaskId),
                        userId: req.user.userId,
                    });
                    if (result.deletedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Completed task not found' });
                    }
                    res.json({
                        message: 'Completed task deleted successfully',
                    });
                }
                catch (error) {
                    console.error('Error deleting completed task:', error);
                    res.status(500).json({
                        error: 'Failed to delete completed task',
                    });
                }
            }));
            // Route pour mettre à jour l'ordre des tâches
            app.put('/tasks/:taskId/reorder', authenticateToken, (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { taskId } = req.params;
                const { newIndex } = req.body;
                if (typeof newIndex !== 'number') {
                    return res.status(400).json({ error: 'Invalid newIndex' });
                }
                try {
                    const result = yield db.collection('Tasks').updateOne({
                        _id: new mongodb_1.ObjectId(taskId),
                        userId: req.user.userId,
                    }, { $set: { order: newIndex } });
                    if (result.modifiedCount === 0) {
                        return res
                            .status(404)
                            .json({ error: 'Task not found or not modified' });
                    }
                    const tasks = yield db
                        .collection('Tasks')
                        .find({ userId: req.user.userId })
                        .sort({ order: 1 })
                        .toArray();
                    res.json(tasks);
                }
                catch (error) {
                    console.error('Error updating task order:', error);
                    res.status(500).json({
                        error: 'Failed to update task order',
                    });
                }
            }));
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    });
}
start();
