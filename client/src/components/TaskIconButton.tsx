import * as React from 'react';
import '../styles/TaskIconButton.css';

interface TaskIconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'danger' | 'secondary' | 'warning';
    title: string;
}

const TaskIconButton: React.FC<TaskIconButtonProps> = ({
    icon,
    onClick,
    color = 'primary',
    title,
}) => {
    return (
        <button
            onClick={onClick}
            className={`task-icon-button ${color}`}
            title={title}
            aria-label={title}
        >
            {icon}
        </button>
    );
};

export default TaskIconButton;
