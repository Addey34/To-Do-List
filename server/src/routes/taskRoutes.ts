import express from 'express';
import TaskController from '../controllers/TaskController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const taskController = new TaskController();

router.use(authenticateToken);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/reorder', taskController.updateTasksOrder);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.post('/:taskId/complete', taskController.completedTask);

export default router;
