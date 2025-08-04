import { jwtDecode } from 'jwt-decode';

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (e) {
        console.error('Token invalid or expired:', e);
        return true;
    }
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = (): void => {
    localStorage.removeItem('token');
};
