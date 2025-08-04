import express from 'express';
import TaskController from '../controllers/TaskController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const taskController = new TaskController();

router.use(authenticateToken);

router.get('/', taskController.getCompletedTasks);
router.delete('/:taskId', taskController.deleteCompletedTask);

export default router;
