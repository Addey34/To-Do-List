const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path'); 

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL;

async function start() {
    const client = new MongoClient(MONGO_CONNECT_URL);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('TaskList');
        const app = express();

        app.use(helmet());
        app.use(express.json({ limit: '1kb' }));
        app.use(cors());
        app.use(bodyParser.json());

        app.use(express.static(path.join(__dirname)));

        function sanitizeInput(input) {
            return sanitizeHtml(input, {
                allowedTags: [],
                allowedAttributes: {}
            });
        }

        function validateTaskText(text) {
            return typeof text === 'string' && text.length > 0 && text.length <= 200;
        }

        function authenticateToken(req, res, next) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token == null) return res.sendStatus(401);

            jwt.verify(token, 'votre_secret_jwt', (err, user) => {
                if (err) return res.sendStatus(403);
                req.user = user;
                next();
            });
        }

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        app.post('/register', async (req, res) => {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            try {
                const existingUser = await db.collection('Users').findOne({ username });
                if (existingUser) {
                    return res.status(400).json({ error: "Username already exists" });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                await db.collection('Users').insertOne({ username, password: hashedPassword });

                res.status(201).json({ message: "User registered successfully" });
            } catch (error) {
                console.error("Error registering user:", error);
                res.status(500).json({ error: "Failed to register user" });
            }
        });

        app.post('/login', async (req, res) => {
            const { username, password } = req.body;

            try {
                const user = await db.collection('Users').findOne({ username });
                if (!user) {
                    return res.status(400).json({ error: "Invalid username or password" });
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(400).json({ error: "Invalid username or password" });
                }

                const token = jwt.sign({ userId: user._id }, 'votre_secret_jwt', { expiresIn: '1h' });
                res.json({ token });
            } catch (error) {
                console.error("Error logging in:", error);
                res.status(500).json({ error: "Failed to log in" });
            }
        });

        app.get('/tasks', authenticateToken, async (req, res) => {
            try {
                const tasks = await db.collection('Tasks').find({ userId: req.user.userId }).sort({ order: 1 }).toArray();
                res.json(tasks);
            } catch (error) {
                console.error("Error retrieving tasks:", error);
                res.status(500).json({ error: "Failed to retrieve tasks" });
            }
        });

        app.get('/completedTasks', authenticateToken, async (req, res) => {
            try {
                const completedTasks = await db.collection('completedTasks').find({ userId: req.user.userId }).toArray();
                res.json(completedTasks);
            } catch (error) {
                console.error("Error retrieving completed tasks:", error);
                res.status(500).json({ error: "Failed to retrieve completed tasks" });
            }
        });

        app.post('/tasks', authenticateToken, async (req, res) => {
            let { taskText } = req.body;
            taskText = sanitizeInput(taskText);
            if (!validateTaskText(taskText)) {
                return res.status(400).json({ error: "Invalid task text" });
            }
            const createdAt = new Date().toISOString();
            try {
                const highestOrderTask = await db.collection('Tasks').findOne({ userId: req.user.userId }, { sort: { order: -1 } });
                const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;
                const result = await db.collection('Tasks').insertOne({ text: taskText, createdAt, order: newOrder, userId: req.user.userId });
                res.status(201).json({ message: "Task added successfully", taskId: result.insertedId });
            } catch (error) {
                console.error("Error adding task:", error);
                res.status(500).json({ error: "Failed to add task" });
            }
        });

        app.post('/completedTasks', authenticateToken, async (req, res) => {
            let { taskText } = req.body;
            taskText = sanitizeInput(taskText);
            if (!validateTaskText(taskText)) {
                return res.status(400).json({ error: "Invalid task text" });
            }
            const createdAt = new Date().toISOString();
            try {
                const result = await db.collection('completedTasks').insertOne({ text: taskText, createdAt, userId: req.user.userId });
                res.status(201).json({ message: "Task moved to completed tasks successfully", taskId: result.insertedId });
            } catch (error) {
                console.error("Error moving task to completed tasks:", error);
                res.status(500).json({ error: "Failed to move task to completed tasks" });
            }
        });

        app.put('/tasks/:taskId', authenticateToken, async (req, res) => {
            const { taskId } = req.params;
            let { text } = req.body;
            text = sanitizeInput(text);
            if (!validateTaskText(text)) {
                return res.status(400).json({ error: "Invalid task text" });
            }
            try {
                await db.collection('Tasks').updateOne({ _id: new ObjectId(taskId), userId: req.user.userId }, { $set: { text: text } });
                const tasks = await db.collection('Tasks').find({ userId: req.user.userId }).sort({ order: 1 }).toArray();
                res.json({ message: "Task updated successfully", tasks });
            } catch (error) {
                console.error("Error updating task:", error);
                res.status(500).json({ error: "Failed to update task" });
            }
        });

        app.put('/tasks/:taskId/complete', authenticateToken, async (req, res) => {
            const { taskId } = req.params;
            try {
                const task = await db.collection('Tasks').findOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                if (!task) {
                    return res.status(404).json({ error: "Task not found" });
                }
                await db.collection('Tasks').deleteOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                await db.collection('completedTasks').insertOne({ text: task.text, createdAt: task.createdAt, userId: req.user.userId });
                res.json({ message: "Task marked as completed successfully" });
            } catch (error) {
                console.error("Error marking task as completed:", error);
                res.status(500).json({ error: "Failed to mark task as completed" });
            }
        });

        app.delete('/tasks/:taskId', authenticateToken, async (req, res) => {
            const { taskId } = req.params;
            try {
                const result = await db.collection('Tasks').deleteOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Task not found" });
                }
                res.json({ message: "Task deleted successfully" });
            } catch (error) {
                console.error("Error deleting task:", error);
                res.status(500).json({ error: "Failed to delete task" });
            }
        });

        app.delete('/completedTasks/:taskId', authenticateToken, async (req, res) => {
            const { taskId } = req.params;
            try {
                const task = await db.collection('completedTasks').findOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                if (!task) {
                    return res.status(404).json({ error: "Completed task not found" });
                }
                await db.collection('completedTasks').deleteOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                res.json({ message: "Completed task deleted successfully" });
            } catch (error) {
                console.error("Error deleting completed task:", error);
                res.status(500).json({ error: "Failed to delete completed task" });
            }
        });

        app.put('/tasks/:taskId/reorder', authenticateToken, async (req, res) => {
            const { taskId } = req.params;
            const { newIndex } = req.body;

            if (typeof newIndex !== 'number' || newIndex < 0) {
                return res.status(400).json({ error: "Invalid new index" });
            }

            try {
                const task = await db.collection('Tasks').findOne({ _id: new ObjectId(taskId), userId: req.user.userId });
                if (!task) {
                    return res.status(404).json({ error: "Task not found" });
                }

                const tasks = await db.collection('Tasks').find({ userId: req.user.userId }).sort({ order: 1 }).toArray();
                if (newIndex >= tasks.length) {
                    return res.status(400).json({ error: "New index out of bounds" });
                }

                tasks.splice(tasks.findIndex(t => t._id.toString() === taskId), 1);
                tasks.splice(newIndex, 0, task);

                const bulkOps = tasks.map((t, i) => ({
                    updateOne: {
                        filter: { _id: t._id, userId: req.user.userId },
                        update: { $set: { order: i } }
                    }
                }));

                await db.collection('Tasks').bulkWrite(bulkOps);

                const updatedTasks = await db.collection('Tasks').find({ userId: req.user.userId }).sort({ order: 1 }).toArray();
                res.json({ message: "Task order updated successfully", tasks: updatedTasks });
            } catch (error) {
                console.error("Error reordering task:", error);
                res.status(500).json({ error: "Failed to reorder task" });
            }
        });

        const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log("Server launched at port: ", port);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

start();
