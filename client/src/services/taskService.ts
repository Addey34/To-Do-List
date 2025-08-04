import axios from 'axios';
import { CompletedTask, Task, TaskOrderUpdate } from '../types/taskTypes';
import { getToken } from '../utils/tokenUtils';

const baseUrl = import.meta.env.VITE_API_URL;

const handleError = (error: any) => {
    console.error(error);
    throw new Error(error.response?.data?.message || 'An error occurred');
};

export const fetchTasks = async (): Promise<Task[]> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        const response = await axios.get<Task[]>(`${baseUrl}/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

export const fetchCompletedTasks = async (): Promise<CompletedTask[]> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        const response = await axios.get<CompletedTask[]>(
            `${baseUrl}/api/completedTasks`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    } catch (error) {
        handleError(error);
        return [];
    }
};

export const addTask = async (taskText: string): Promise<Task> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        const response = await axios.post<Task>(
            `${baseUrl}/api/tasks`,
            { taskText },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    } catch (error) {
        handleError(error);
        return {} as Task;
    }
};

export const completeTask = async (taskId: string): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        await axios.post(
            `${baseUrl}/api/tasks/${taskId}/complete`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    } catch (error) {
        handleError(error);
    }
};

export const duplicateTask = async (taskText: string): Promise<Task> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        const response = await axios.post<Task>(
            `${baseUrl}/api/tasks`,
            { taskText },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    } catch (error) {
        handleError(error);
        return {} as Task;
    }
};

export const updateTask = async (
    taskId: string,
    updatedText: string
): Promise<Task> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        console.log('Task ID:', taskId);
        console.log('Updated Text:', updatedText);

        const response = await axios.put<Task>(
            `${baseUrl}/api/tasks/${taskId}`,
            { text: updatedText },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        return response.data;
    } catch (error) {
        handleError(error);
        return {} as Task;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        await axios.delete(`${baseUrl}/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error) {
        handleError(error);
    }
};

export const deleteCompletedTask = async (taskId: string): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        await axios.delete(`${baseUrl}/api/completedTasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error) {
        handleError(error);
    }
};

export const reorderTasks = async (
    updates: TaskOrderUpdate[]
): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No token found');
        await axios.put(
            `${baseUrl}/api/tasks/reorder`,
            { updates },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    } catch (error) {
        handleError(error);
    }
};
