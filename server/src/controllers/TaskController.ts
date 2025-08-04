import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { sanitizeInput, validateTaskText } from '../utils/validation';

export default class TaskController {
    private taskService: TaskService;

    constructor() {
        this.taskService = new TaskService();
    }

    getTasks = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const tasks = await this.taskService.getTasks(req.user.userId);
            res.json(tasks);
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            res.status(500).json({ error: 'Failed to retrieve tasks' });
        }
    };

    getCompletedTasks = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const tasks = await this.taskService.getCompletedTasks(
                req.user.userId
            );
            res.json(tasks);
        } catch (error) {
            console.error('Error retrieving completed tasks:', error);
            res.status(500).json({
                error: 'Failed to retrieve completed tasks',
            });
        }
    };

    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const text = sanitizeInput(req.body.taskText);
            if (!validateTaskText(text)) {
                res.status(400).json({ error: 'Invalid task text' });
                return;
            }

            const taskId = await this.taskService.createTask({
                text,
                userId: req.user.userId,
                order: 0,
                createdAt: new Date().toISOString(),
            });

            res.status(201).json({ message: 'Task created', taskId });
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    };

    completedTask = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { taskId } = req.params;
            const success = await this.taskService.completeTask(
                taskId,
                req.user.userId
            );

            if (!success) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            res.json({ message: 'Task marked as complete' });
        } catch (error) {
            console.error('Error completing task:', error);
            res.status(500).json({ error: 'Failed to complete task' });
        }
    };

    updateTask = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { taskId } = req.params;
            const text = sanitizeInput(req.body.text);

            if (!validateTaskText(text)) {
                res.status(400).json({ error: 'Invalid task text' });
                return;
            }

            await this.taskService.updateTask(taskId, req.user.userId, text);
            res.json({ message: 'Task updated successfully' });
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    };

    deleteTask = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { taskId } = req.params;
            const success = await this.taskService.deleteTask(
                taskId,
                req.user.userId
            );

            if (!success) {
                res.status(404).json({ error: 'Task not found' });
                return;
            }

            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    };

    deleteCompletedTask = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { taskId } = req.params;
            const success = await this.taskService.deleteCompletedTask(
                taskId,
                req.user.userId
            );

            if (!success) {
                res.status(404).json({ error: 'Completed task not found' });
                return;
            }

            res.json({ message: 'Completed task deleted successfully' });
        } catch (error) {
            console.error('Error deleting completed task:', error);
            res.status(500).json({ error: 'Failed to delete completed task' });
        }
    };

    updateTasksOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { updates } = req.body;
            if (!Array.isArray(updates)) {
                res.status(400).json({ error: 'Invalid updates format' });
                return;
            }

            await this.taskService.updateTasksOrder(updates, req.user.userId);
            res.json({ message: 'Tasks order updated successfully' });
        } catch (error) {
            console.error('Error updating tasks order:', error);
            res.status(500).json({ error: 'Failed to update tasks order' });
        }
    };
}
