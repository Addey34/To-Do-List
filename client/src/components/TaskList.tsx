import { CheckCircleIcon as CheckCircleOutline } from '@heroicons/react/24/outline';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    CheckCircleIcon as CheckCircleSolid,
    CheckIcon,
    DocumentDuplicateIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';

import axios, { AxiosError } from 'axios';
import * as React from 'react';
import { useEffect, useState } from 'react';
import Sortable from 'sortablejs';
import '../styles/TaskList.css';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import TaskIconButton from './TaskIconButton';

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

interface TaskOrderUpdate {
    taskId: string;
    newOrder: number;
}

interface TaskListProps {
    tasks: Task[];
    completedTasks: CompletedTask[];
    fetchTasks: () => Promise<void>;
    fetchCompletedTasks: () => Promise<void>;
}

interface ErrorResponse {
    error?: string;
    message?: string;
}

const baseUrl = import.meta.env.VITE_API_URL;

const TaskList: React.FC<TaskListProps> = ({
    tasks,
    completedTasks,
    fetchTasks,
    fetchCompletedTasks,
}) => {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedText, setEditedText] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>(
        'active'
    );
    const [isLoading, setIsLoading] = useState(false);
    const [newTaskId, setNewTaskId] = useState<string | null>(null);

    const getToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'completed') {
                    await fetchCompletedTasks();
                } else {
                    await fetchTasks();
                }
            } catch (error) {
                console.error('Error loading tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeTab, fetchTasks, fetchCompletedTasks]);

    const handleTaskAction = async (
        taskId: string,
        action:
            | 'complete'
            | 'delete'
            | 'deleteCompleted'
            | 'duplicate'
            | 'edit',
        text?: string
    ) => {
        const token = getToken();
        if (!token) return;

        try {
            switch (action) {
                case 'complete':
                    await axios.post(
                        `${baseUrl}/api/tasks/${taskId}/complete`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setNewTaskId(null);
                    break;
                case 'delete':
                    await axios.delete(`${baseUrl}/api/tasks/${taskId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    break;
                case 'deleteCompleted':
                    await axios.delete(
                        `${baseUrl}/api/completedTasks/${taskId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    break;
                case 'duplicate':
                    const duplicateRes = await axios.post(
                        `${baseUrl}/api/tasks`,
                        { taskText: text },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setNewTaskId(duplicateRes.data.taskId);
                    break;
                case 'edit':
                    await axios.put(
                        `${baseUrl}/api/tasks/${taskId}`,
                        { text: editedText },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setEditingTaskId(null);
                    break;
            }

            await Promise.all([fetchTasks(), fetchCompletedTasks()]);
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            console.error(
                'Error performing task action:',
                axiosError.response?.data || axiosError.message
            );
        }
    };

    const initSortable = (element: HTMLElement | null) => {
        if (!element) return;

        new Sortable(element, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.drag-handle',
            onEnd: async (evt) => {
                const { oldIndex, newIndex } = evt;
                if (
                    oldIndex === undefined ||
                    newIndex === undefined ||
                    oldIndex === newIndex
                ) {
                    return;
                }

                const items = Array.from(
                    element.querySelectorAll('.task-item')
                );
                const taskIds = items
                    .map((item) => item.getAttribute('data-id'))
                    .filter((id): id is string => !!id);

                // Calculer les nouveaux ordres
                const updates: TaskOrderUpdate[] = [];
                let prevOrder = 0;
                let nextOrder = 0;

                for (let i = 0; i < taskIds.length; i++) {
                    const taskId = taskIds[i];
                    const task = tasks.find((t) => t._id === taskId);
                    if (!task) continue;

                    if (i === 0) {
                        // Premier élément
                        const nextTask = tasks.find(
                            (t) => t._id === taskIds[i + 1]
                        );
                        if (nextTask) {
                            task.order = Math.floor(nextTask.order / 2);
                        } else {
                            task.order = task.order + 65536;
                        }
                    } else if (i === taskIds.length - 1) {
                        // Dernier élément
                        const prevTask = tasks.find(
                            (t) => t._id === taskIds[i - 1]
                        );
                        if (prevTask) {
                            task.order = prevTask.order + 65536;
                        }
                    } else {
                        // Élément au milieu
                        const prevTask = tasks.find(
                            (t) => t._id === taskIds[i - 1]
                        );
                        const nextTask = tasks.find(
                            (t) => t._id === taskIds[i + 1]
                        );
                        if (prevTask && nextTask) {
                            task.order = Math.floor(
                                (prevTask.order + nextTask.order) / 2
                            );
                        }
                    }

                    updates.push({
                        taskId,
                        newOrder: task.order,
                    });
                }

                try {
                    const token = getToken();
                    if (!token) return;

                    await axios.put(
                        `${baseUrl}/api/tasks/reorder`,
                        { updates },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    await fetchTasks();
                } catch (error) {
                    console.error('Error updating order:', error);
                    await fetchTasks();
                }
            },
        });
    };

    const startEditing = (taskId: string, text: string) => {
        setEditingTaskId(taskId);
        setEditedText(text);
    };

    const cancelEditing = () => {
        setEditingTaskId(null);
    };

    return (
        <div className="tasks-container">
            <div className="tabs-container">
                <button
                    className={`tab-button ${
                        activeTab === 'active' ? 'active' : ''
                    }`}
                    onClick={async () => {
                        setIsLoading(true);
                        await fetchTasks();
                        setIsLoading(false);
                        setActiveTab('active');
                    }}
                    disabled={isLoading}
                >
                    <CheckCircleOutline className="tab-icon icon" />
                    Active Tasks
                    <span
                        className="badge"
                        style={{
                            visibility: tasks.length > 0 ? 'visible' : 'hidden',
                        }}
                    >
                        {tasks.length || 0}
                    </span>
                </button>
                <button
                    className={`tab-button ${
                        activeTab === 'completed' ? 'active' : ''
                    }`}
                    onClick={async () => {
                        setIsLoading(true);
                        await fetchCompletedTasks();
                        setIsLoading(false);
                        setActiveTab('completed');
                    }}
                    disabled={isLoading}
                >
                    <CheckCircleSolid className="tab-icon icon" />
                    Completed Tasks
                    <span
                        className="badge"
                        style={{
                            visibility:
                                completedTasks.length > 0
                                    ? 'visible'
                                    : 'hidden',
                        }}
                    >
                        {completedTasks.length || 0}
                    </span>
                </button>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {activeTab === 'active' && (
                        <div className="tab-content active">
                            {tasks.length === 0 ? (
                                <EmptyState
                                    icon={
                                        <CheckIcon className="empty-state-icon" />
                                    }
                                    title="No tasks yet"
                                    subtitle="Add your first task to get started"
                                />
                            ) : (
                                <ul className="task-list" ref={initSortable}>
                                    {tasks.map((task) => (
                                        <li
                                            key={task._id}
                                            className={`task-item ${
                                                editingTaskId === task._id
                                                    ? 'editing'
                                                    : ''
                                            } ${
                                                newTaskId === task._id
                                                    ? 'new-task'
                                                    : ''
                                            }`}
                                            data-id={task._id}
                                        >
                                            {editingTaskId === task._id ? (
                                                <div className="edit-mode">
                                                    <input
                                                        type="text"
                                                        className="edit-input"
                                                        value={editedText}
                                                        onChange={(e) =>
                                                            setEditedText(
                                                                e.target.value
                                                            )
                                                        }
                                                        autoFocus
                                                    />
                                                    <div className="edit-actions">
                                                        <TaskIconButton
                                                            icon={
                                                                <CheckIcon className="task-icon" />
                                                            }
                                                            onClick={() =>
                                                                handleTaskAction(
                                                                    task._id,
                                                                    'edit'
                                                                )
                                                            }
                                                            color="secondary"
                                                            title="Save"
                                                        />
                                                        <TaskIconButton
                                                            icon={
                                                                <XMarkIcon className="task-icon" />
                                                            }
                                                            onClick={
                                                                cancelEditing
                                                            }
                                                            color="danger"
                                                            title="Cancel"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="task-content">
                                                        <span className="task-text">
                                                            {task.text}
                                                        </span>
                                                        <div className="task-actions">
                                                            <TaskIconButton
                                                                icon={
                                                                    <CheckIcon className="task-icon" />
                                                                }
                                                                onClick={() =>
                                                                    handleTaskAction(
                                                                        task._id,
                                                                        'complete'
                                                                    )
                                                                }
                                                                color="secondary"
                                                                title="Complete task"
                                                            />
                                                            <TaskIconButton
                                                                icon={
                                                                    <DocumentDuplicateIcon className="task-icon" />
                                                                }
                                                                onClick={() =>
                                                                    handleTaskAction(
                                                                        task._id,
                                                                        'duplicate',
                                                                        task.text
                                                                    )
                                                                }
                                                                title="Duplicate task"
                                                            />
                                                            <TaskIconButton
                                                                icon={
                                                                    <PencilIcon className="task-icon" />
                                                                }
                                                                onClick={() =>
                                                                    startEditing(
                                                                        task._id,
                                                                        task.text
                                                                    )
                                                                }
                                                                color="warning"
                                                                title="Edit task"
                                                            />
                                                            <TaskIconButton
                                                                icon={
                                                                    <TrashIcon className="task-icon" />
                                                                }
                                                                onClick={() =>
                                                                    handleTaskAction(
                                                                        task._id,
                                                                        'delete'
                                                                    )
                                                                }
                                                                color="danger"
                                                                title="Delete task"
                                                            />
                                                            <div className="drag-handle">
                                                                <ArrowUpIcon className="drag-icon" />
                                                                <ArrowDownIcon className="drag-icon" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {activeTab === 'completed' && (
                        <div className="tab-content completed">
                            {completedTasks.length === 0 ? (
                                <EmptyState
                                    icon={
                                        <CheckIcon className="empty-state-icon" />
                                    }
                                    title="No completed tasks yet"
                                    subtitle="Complete some tasks to see them here"
                                />
                            ) : (
                                <ul className="task-list">
                                    {completedTasks.map((task) => (
                                        <li
                                            key={task._id}
                                            className="task-item completed"
                                        >
                                            <div className="task-content">
                                                <span className="task-text">
                                                    {task.text}
                                                </span>
                                                <div className="task-actions">
                                                    <TaskIconButton
                                                        icon={
                                                            <TrashIcon className="task-icon" />
                                                        }
                                                        onClick={() =>
                                                            handleTaskAction(
                                                                task._id,
                                                                'deleteCompleted'
                                                            )
                                                        }
                                                        color="danger"
                                                        title="Delete task"
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TaskList;
