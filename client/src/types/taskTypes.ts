export interface Task {
    _id: string;
    text: string;
    order: number;
    userId: string;
    createdAt: string;
}

export interface CompletedTask extends Task {
    completedAt: string;
}

export interface TaskOrderUpdate {
    taskId: string;
    newOrder: number;
}

export interface ErrorResponse {
    error?: string;
    message?: string;
}
