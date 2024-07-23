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
const bcrypt_1 = __importDefault(require("bcrypt"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const mongoClient_1 = require("./mongoClient");
dotenv_1.default.config();
const app = (0, express_1.default)();
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '1kb' }));
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
function sanitizeInput(input) {
    return (0, sanitize_html_1.default)(input, {
        allowedTags: [],
        allowedAttributes: {},
    });
}
function validateTaskText(text) {
    return typeof text === 'string' && text.length > 0 && text.length <= 200;
}
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
        return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    if (!token)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
        if (err)
            return res.sendStatus(403);
        if (typeof decoded === 'string')
            return res.sendStatus(403);
        req.user = decoded;
        next();
    });
}
app.get('/', (req, res) => {
    res.send('Express on Vercel');
});
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password)
        return res
            .status(400)
            .json({ error: 'Username and password are required' });
    try {
        const db = mongoClient_1.client.db('TaskList');
        const existingUser = yield db.collection('Users').findOne({ username });
        if (existingUser)
            return res.status(400).json({ error: 'Username already exists' });
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield db
            .collection('Users')
            .insertOne({ username, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const db = mongoClient_1.client.db('TaskList');
        const user = yield db.collection('Users').findOne({ username });
        if (!user)
            return res
                .status(400)
                .json({ error: 'Invalid username or password' });
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid)
            return res
                .status(400)
                .json({ error: 'Invalid username or password' });
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
app.get('/tasks', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = mongoClient_1.client.db('TaskList');
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
app.post('/tasks', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { taskText } = req.body;
    taskText = sanitizeInput(taskText);
    if (!validateTaskText(taskText))
        return res.status(400).json({ error: 'Invalid task text' });
    const createdAt = new Date().toISOString();
    try {
        const db = mongoClient_1.client.db('TaskList');
        const highestOrderTask = yield db
            .collection('Tasks')
            .findOne({ userId: req.user.userId }, { sort: { order: -1 } });
        const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;
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
app.put('/tasks/:taskId', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    let { text } = req.body;
    text = sanitizeInput(text);
    if (!validateTaskText(text))
        return res.status(400).json({ error: 'Invalid task text' });
    try {
        const db = mongoClient_1.client.db('TaskList');
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
app.delete('/tasks/:taskId', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const db = mongoClient_1.client.db('TaskList');
        const result = yield db.collection('Tasks').deleteOne({
            _id: new mongodb_1.ObjectId(taskId),
            userId: req.user.userId,
        });
        if (result.deletedCount === 0)
            return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
}));
app.delete('/completedTasks/:taskId', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const db = mongoClient_1.client.db('TaskList');
        const result = yield db.collection('CompletedTasks').deleteOne({
            _id: new mongodb_1.ObjectId(taskId),
            userId: req.user.userId,
        });
        if (result.deletedCount === 0)
            return res
                .status(404)
                .json({ error: 'Completed task not found' });
        res.json({ message: 'Completed task deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting completed task:', error);
        res.status(500).json({ error: 'Failed to delete completed task' });
    }
}));
app.get('/completedTasks', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = mongoClient_1.client.db('TaskList');
        const completedTasks = yield db
            .collection('CompletedTasks')
            .find({ userId: req.user.userId })
            .toArray();
        res.json(completedTasks);
    }
    catch (error) {
        console.error('Error retrieving completed tasks:', error);
        res.status(500).json({
            error: 'Failed to retrieve completed tasks',
        });
    }
}));
app.post('/tasks/:taskId/complete', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const db = mongoClient_1.client.db('TaskList');
        const task = yield db.collection('Tasks').findOne({
            _id: new mongodb_1.ObjectId(taskId),
            userId: req.user.userId,
        });
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        yield db.collection('CompletedTasks').insertOne(Object.assign(Object.assign({}, task), { completedAt: new Date().toISOString() }));
        yield db.collection('Tasks').deleteOne({
            _id: new mongodb_1.ObjectId(taskId),
            userId: req.user.userId,
        });
        res.json({ message: 'Task marked as complete' });
    }
    catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ error: 'Failed to complete task' });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
