import { PlusCircleIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import TaskList from '../components/task/TaskList';
import TaskIconButton from '../components/ui/TaskIconButton';
import { useTasks } from '../hooks/useTasks';
import {
    addTask,
    completeTask,
    deleteCompletedTask,
    deleteTask,
    duplicateTask,
    reorderTasks,
    updateTask,
} from '../services/taskService';
import '../styles/TodoApp.css';
import { TaskOrderUpdate } from '../types/taskTypes';

const TodoApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { tasks, completedTasks, loadTasks, loadCompletedTasks } = useTasks();
    const [taskText, setTaskText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedText, setEditedText] = useState('');

    const handleAddTask = async () => {
        const newTask = await addTask(taskText);
        if (newTask) {
            loadTasks();
            setTaskText('');
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        await completeTask(taskId);
        loadTasks();
        loadCompletedTasks();
    };

    const handleDuplicateTask = async (taskId: string) => {
        const taskToDuplicate = tasks.find((task) => task._id === taskId);
        if (taskToDuplicate) {
            const newTask = await duplicateTask(taskToDuplicate.text);
            loadTasks();
        }
    };

    const handleStartEditing = (taskId: string, currentText: string) => {
        setEditingTaskId(taskId);
        setEditedText(currentText);
    };

    const handleEditTask = async () => {
        if (editingTaskId && editedText) {
            await updateTask(editingTaskId, editedText);
            setEditingTaskId(null);
            setEditedText('');
            loadTasks();
        }
    };

    const handleCancelEditing = () => {
        setEditingTaskId(null);
        setEditedText('');
    };

    const handleDeleteTask = async (taskId: string) => {
        await deleteTask(taskId);
        loadTasks();
    };

    const handleDeleteCompletedTask = async () => {
        await deleteCompletedTask(completedTasks[0]._id);
        loadTasks();
        loadCompletedTasks();
    };

    const handleReorderTasks = async (updates: TaskOrderUpdate[]) => {
        console.log('Reorder tasks updates:', updates);
        await reorderTasks(updates);
        loadTasks();
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">To Do List</h1>
                <button className="btn btn-logout" onClick={onLogout}>
                    Logout
                </button>
            </header>

            <div className="input-fields">
                <input
                    className="form-input"
                    type="text"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="Add a task"
                />
                <TaskIconButton
                    icon={<PlusCircleIcon />}
                    onClick={handleAddTask}
                    color="secondary"
                    title="Save"
                    className="btn-add"
                />
            </div>

            <TaskList
                tasks={tasks}
                completedTasks={completedTasks}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onDeleteCompleted={handleDeleteCompletedTask}
                onDuplicate={handleDuplicateTask}
                onStartEditing={handleStartEditing}
                editedText={editedText}
                setEditedText={setEditedText}
                onEdit={handleEditTask}
                onCancelEditing={handleCancelEditing}
                editingTaskId={editingTaskId}
                onReorderTasks={handleReorderTasks}
            />
        </div>
    );
};

export default TodoApp;
