import {
    CheckIcon,
    DocumentDuplicateIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';
import React from 'react';
import '../../styles/TaskItem.css';
import { CompletedTask, Task } from '../../types/taskTypes';
import TaskIconButton from '../ui/TaskIconButton';

interface TaskItemProps {
    task: Task | CompletedTask;
    onComplete: () => void;
    onDelete: () => void;
    onDeleteCompleted: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
    isEditing: boolean;
    onStartEditing: () => void;
    editedText: string;
    setEditedText: React.Dispatch<React.SetStateAction<string>>;
    onCancelEditing: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
    task,
    onComplete,
    onDelete,
    onDeleteCompleted,
    onDuplicate,
    onEdit,
    isEditing,
    onStartEditing,
    editedText,
    setEditedText,
    onCancelEditing,
}) => {
    const isCompleted = 'completedAt' in task;

    return (
        <li
            className={`task-item ${isEditing ? 'editing' : ''}${
                !isCompleted ? 'active' : ''
            }`}
            data-id={task._id}
            draggable={!isCompleted}
        >
            {isEditing ? (
                <div className="edit-mode">
                    <input
                        type="text"
                        className="edit-input"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        autoFocus
                    />
                    <div className="edit-actions">
                        <TaskIconButton
                            icon={<CheckIcon />}
                            onClick={onEdit}
                            color="secondary"
                            title="Save"
                        />
                        <TaskIconButton
                            icon={<XMarkIcon />}
                            onClick={onCancelEditing}
                            color="danger"
                            title="Cancel"
                        />
                    </div>
                </div>
            ) : (
                <div className="task-content">
                    <span className="task-text">{task.text}</span>
                    <div className="task-actions">
                        {!isCompleted && (
                            <>
                                <TaskIconButton
                                    icon={<CheckIcon />}
                                    onClick={onComplete}
                                    color="secondary"
                                    title="Complete task"
                                />
                                <TaskIconButton
                                    icon={<DocumentDuplicateIcon />}
                                    onClick={onDuplicate}
                                    title="Duplicate task"
                                />
                                <TaskIconButton
                                    icon={<PencilIcon />}
                                    onClick={onStartEditing}
                                    color="warning"
                                    title="Edit task"
                                />
                            </>
                        )}
                        <TaskIconButton
                            icon={<TrashIcon />}
                            onClick={isCompleted ? onDeleteCompleted : onDelete}
                            color="danger"
                            title="Delete task"
                        />
                    </div>
                </div>
            )}
        </li>
    );
};

export default TaskItem;
