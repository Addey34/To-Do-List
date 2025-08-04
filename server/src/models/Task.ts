import { ObjectId } from 'mongodb';

export interface ITask {
    _id?: ObjectId;
    text: string;
    userId: string;
    order: number;
    createdAt: string;
}

export interface ICompletedTask extends ITask {
    completedAt: string;
}
