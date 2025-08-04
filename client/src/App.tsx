import * as React from 'react';
import { useEffect, useState } from 'react';
import LoginForm from './pages/LoginForm';
import TodoApp from './pages/TodoApp';
import { getToken, isTokenExpired, removeToken } from './utils/tokenUtils';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (token && !isTokenExpired(token)) {
            setIsLoggedIn(true);
        } else {
            removeToken();
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        removeToken();
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
