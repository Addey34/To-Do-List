import { Db, ObjectId } from 'mongodb';
import { DatabaseService } from '../config/database';
import { ICompletedTask, ITask } from '../models/Task';

export class TaskService {
    constructor() {
        this.init().catch(console.error);
    }

    private db: Db | null = null;

    async init() {
        if (!this.db) {
            this.db = await DatabaseService.getInstance().connect();
        }
    }

    async getTasks(userId: string): Promise<ITask[]> {
        const tasks = await this.db!.collection<ITask>('Tasks')
            .find({ userId })
            .sort({ order: 1 })
            .toArray();
        return tasks.map(
            (task) =>
                ({
                    _id: task._id,
                    text: task.text,
                    userId: task.userId,
                    order: task.order,
                    createdAt: task.createdAt,
                } as ITask)
        );
    }

    async getCompletedTasks(userId: string): Promise<ICompletedTask[]> {
        const completedTasks = await this.db!.collection<ICompletedTask>(
            'CompletedTasks'
        )
            .find({ userId })
            .sort({ completedAt: -1 })
            .toArray();
        return completedTasks.map(
            (task) =>
                ({
                    _id: task._id,
                    text: task.text,
                    userId: task.userId,
                    order: task.order,
                    createdAt: task.createdAt,
                    completedAt: task.completedAt,
                } as ICompletedTask)
        );
    }

    async createTask(task: Omit<ITask, '_id'>): Promise<ObjectId> {
        const INITIAL_ORDER = 65536;

        const lastTask = await this.db!.collection<ITask>('Tasks')
            .find({ userId: task.userId })
            .sort({ order: -1 })
            .limit(1)
            .toArray();

        const newOrder =
            lastTask.length > 0
                ? lastTask[0].order + INITIAL_ORDER
                : INITIAL_ORDER;

        const result = await this.db!.collection('Tasks').insertOne({
            ...task,
            order: newOrder,
            createdAt: new Date().toISOString(),
        });
        return result.insertedId;
    }

    async updateTask(
        taskId: string,
        userId: string,
        text: string
    ): Promise<void> {
        await this.db!.collection('Tasks').updateOne(
            { _id: new ObjectId(taskId), userId },
            { $set: { text } }
        );
    }

    async deleteTask(taskId: string, userId: string): Promise<boolean> {
        const result = await this.db!.collection('Tasks').deleteOne({
            _id: new ObjectId(taskId),
            userId,
        });
        return result.deletedCount > 0;
    }

    async completeTask(taskId: string, userId: string): Promise<boolean> {
        const task = await this.db!.collection('Tasks').findOne({
            _id: new ObjectId(taskId),
            userId,
        });
        if (!task) return false;
        const completedTask: ICompletedTask = {
            _id: task._id,
            text: task.text,
            userId: task.userId,
            order: task.order,
            createdAt: task.createdAt,
            completedAt: new Date().toISOString(),
        };
        await this.db!.collection('CompletedTasks').insertOne(completedTask);
        await this.db!.collection('Tasks').deleteOne({
            _id: new ObjectId(taskId),
            userId,
        });
        return true;
    }

    async deleteCompletedTask(
        taskId: string,
        userId: string
    ): Promise<boolean> {
        const result = await this.db!.collection('CompletedTasks').deleteOne({
            _id: new ObjectId(taskId),
            userId,
        });
        return result.deletedCount > 0;
    }

    async updateTasksOrder(
        updates: { taskId: string; newOrder: number }[],
        userId: string
    ): Promise<void> {
        const bulkOps = updates.map(({ taskId, newOrder }) => ({
            updateOne: {
                filter: { _id: new ObjectId(taskId), userId },
                update: { $set: { order: newOrder } },
            },
        }));

        await this.db!.collection('Tasks').bulkWrite(bulkOps);
    }
}
