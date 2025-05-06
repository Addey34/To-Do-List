import axios, { AxiosError, AxiosResponse } from 'axios';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import '../styles/TodoApp.css';
import TaskList from './TaskList';

interface TodoAppProps {
    onLogout: () => void;
}

interface Task {
    _id: string;
    text: string;
    order: number;
    userId: string;
    createdAt: string;
}

interface CompletedTask extends Task {
    completedAt: string;
}

interface ErrorResponse {
    error?: string;
    message?: string;
}

const baseUrl = import.meta.env.VITE_API_URL;

const TodoApp: React.FC<TodoAppProps> = ({ onLogout }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
    const [taskText, setTaskText] = useState('');

    const getToken = useCallback(() => {
        return localStorage.getItem('token');
    }, []);

    const fetchTasks = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const response: AxiosResponse<Task[]> = await axios.get(
                `${baseUrl}/api/tasks`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTasks(response.data);
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            console.error(
                'Error fetching tasks:',
                axiosError.response?.data || axiosError.message
            );
        }
    }, [getToken]);

    const fetchCompletedTasks = useCallback(async () => {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            const response = await axios.get<CompletedTask[]>(
                `${baseUrl}/api/completedTasks`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setCompletedTasks(response.data);
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            const errorMessage =
                axiosError.response?.data?.message || axiosError.message;
            console.error('Error fetching completed tasks:', errorMessage);
        }
    }, [getToken]);

    useEffect(() => {
        fetchTasks();
        fetchCompletedTasks();
    }, [fetchTasks, fetchCompletedTasks]);

    const handleAddTask = async () => {
        const text = taskText.trim();
        if (text === '' || text.length > 200) return;

        const token = getToken();
        if (!token) return;

        try {
            await axios.post(
                `${baseUrl}/api/tasks`,
                { taskText: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTaskText('');
            await fetchTasks();
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            console.error(
                'Error adding task:',
                axiosError.response?.data || axiosError.message
            );
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    };

    return (
        <div id="todo-app">
            <header className="app-header">
                <div className="spacer"></div>
                <h1 className="app-title">To Do List</h1>
                <button className="btn btn-logout" onClick={onLogout}>
                    Logout
                </button>
            </header>

            <div className="app-container">
                <div className="input-fields">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Add a task"
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        maxLength={200}
                    />
                    <button
                        className="btn btn-primary "
                        onClick={handleAddTask}
                    >
                        Add Task
                    </button>
                </div>
                <TaskList
                    tasks={tasks}
                    completedTasks={completedTasks}
                    fetchTasks={fetchTasks}
                    fetchCompletedTasks={fetchCompletedTasks}
                />
            </div>
        </div>
    );
};

export default TodoApp;
