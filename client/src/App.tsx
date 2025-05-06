import * as React from 'react';
import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import TodoApp from './components/TodoApp';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return (
        <div>
            {isLoggedIn ? (
                <TodoApp onLogout={handleLogout} />
            ) : (
                <LoginForm onLogin={handleLogin} />
            )}
        </div>
    );
};

export default App;
