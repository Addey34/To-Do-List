import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useEffect } from 'react';
import Sortable from 'sortablejs';
import '../../styles/TaskList.css';
import { CompletedTask, Task, TaskOrderUpdate } from '../../types/taskTypes';
import EmptyState from '../ui/EmptyState';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    completedTasks: CompletedTask[];
    onComplete: (taskId: string) => Promise<void>;
    onDelete: (taskId: string) => Promise<void>;
    onDeleteCompleted: (taskId: string) => Promise<void>;
    onDuplicate: (taskId: string) => Promise<void>;
    onStartEditing: (taskId: string, currentText: string) => void;
    editedText: string;
    setEditedText: React.Dispatch<React.SetStateAction<string>>;
    onEdit: () => void;
    onCancelEditing: () => void;
    editingTaskId: string | null;
    onReorderTasks: (updates: TaskOrderUpdate[]) => Promise<void>;
}

const TaskList: React.FC<TaskListProps> = ({
    tasks,
    completedTasks,
    onComplete,
    onDelete,
    onDeleteCompleted,
    onDuplicate,
    onStartEditing,
    editedText,
    setEditedText,
    onEdit,
    onCancelEditing,
    editingTaskId,
    onReorderTasks,
}) => {
    const [activeTab, setActiveTab] = React.useState<'active' | 'completed'>(
        'active'
    );
    const tasksListRef = React.useRef<HTMLUListElement>(null);
    const activeTaskCount = tasks.length;
    const completedTaskCount = completedTasks.length;

    const handleTabChange = (tab: 'active' | 'completed') => {
        setActiveTab(tab);
    };

    useEffect(() => {
        if (tasksListRef.current) {
            const sortable = new Sortable(tasksListRef.current, {
                onStart: (event: any) => {
                    console.log('Drag started', event);
                },
                onEnd: (event: any) => {
                    console.log('Drag ended', event);
                    const reorderedTasks = Array.from(event.from.children)
                        .filter(
                            (item: any) => !item.classList.contains('completed')
                        )
                        .map((item: any, index: number) => ({
                            taskId: item.dataset.id,
                            newOrder: index + 1,
                        }));

                    console.log('Reordered tasks:', reorderedTasks);
                    onReorderTasks(reorderedTasks);
                },
                animation: 150,
                draggable: '.task-item.active',
                handle: '.task-item',
                ghostClass: 'sortable-ghost',
            });

            return () => sortable.destroy();
        }
    }, [tasks]);

    return (
        <div className="tasks-container">
            <div className="tabs-container">
                <button
                    className={`tab-button ${
                        activeTab === 'active' ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange('active')}
                >
                    Active Tasks
                    <span className="badge">{activeTaskCount}</span>
                </button>
                <button
                    className={`tab-button ${
                        activeTab === 'completed' ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange('completed')}
                >
                    Completed Tasks
                    <span className="badge">{completedTaskCount}</span>
                </button>
            </div>

            {activeTab === 'active' && tasks.length === 0 && (
                <EmptyState
                    icon={<CheckIcon />}
                    title="No tasks yet"
                    subtitle="Add your first task!"
                />
            )}

            {activeTab === 'completed' && completedTasks.length === 0 && (
                <EmptyState
                    icon={<CheckIcon />}
                    title="No completed tasks yet"
                    subtitle="Complete some tasks!"
                />
            )}

            <ul ref={tasksListRef} className="task-list">
                {activeTab === 'active' &&
                    tasks.map((task) => (
                        <TaskItem
                            key={task._id}
                            task={task}
                            onComplete={() => onComplete(task._id)}
                            onDelete={() => onDelete(task._id)}
                            onDeleteCompleted={() => {}}
                            onDuplicate={() => onDuplicate(task._id)}
                            isEditing={task._id === editingTaskId}
                            onStartEditing={() =>
                                onStartEditing(task._id, task.text)
                            }
                            editedText={editedText}
                            setEditedText={setEditedText}
                            onEdit={onEdit}
                            onCancelEditing={onCancelEditing}
                        />
                    ))}
                {activeTab === 'completed' &&
                    completedTasks.map((task) => (
                        <TaskItem
                            key={task._id}
                            task={task}
                            onComplete={() => onComplete(task._id)}
                            onDuplicate={() => onDuplicate(task._id)}
                            onDelete={() => {}}
                            onDeleteCompleted={() =>
                                onDeleteCompleted(task._id)
                            }
                            isEditing={false}
                            onStartEditing={() => {}}
                            editedText=""
                            setEditedText={() => {}}
                            onEdit={() => {}}
                            onCancelEditing={onCancelEditing}
                        />
                    ))}
            </ul>
        </div>
    );
};

export default TaskList;
