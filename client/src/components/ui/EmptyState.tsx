import * as React from 'react';
import '../../styles/EmptyState.css';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => (
    <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <h3 className="empty-state-title">{title}</h3>
        {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
    </div>
);

export default EmptyState;
