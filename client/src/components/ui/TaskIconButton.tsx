import * as React from 'react';
import '../../styles/TaskIconButton.css';

interface TaskIconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'danger' | 'secondary' | 'warning';
    title: string;
    className?: string;
}

const TaskIconButton: React.FC<TaskIconButtonProps> = ({
    icon,
    onClick,
    color = 'primary',
    title,
    className = '',
}) => {
    return (
        <button
            onClick={onClick}
            className={`task-icon-button ${color} ${className}`}
            title={title}
            aria-label={title}
        >
            {icon}
        </button>
    );
};

export default TaskIconButton;
