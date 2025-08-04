import { useEffect, useState } from 'react';
import { fetchCompletedTasks, fetchTasks } from '../services/taskService';
import { CompletedTask, Task } from '../types/taskTypes';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const fetchedTasks = await fetchTasks();
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error fetching tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCompletedTasks = async () => {
        setIsLoading(true);
        try {
            const fetchedCompletedTasks = await fetchCompletedTasks();
            setCompletedTasks(fetchedCompletedTasks);
        } catch (error) {
            console.error('Error fetching completed tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
        loadCompletedTasks();
    }, []);

    return { tasks, completedTasks, isLoading, loadTasks, loadCompletedTasks };
};
