import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

// Instância padrão do Axios para o Backend
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('@saas:token');
        const storedUser = localStorage.getItem('@saas:user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('@saas:token', newToken);
        localStorage.setItem('@saas:user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('@saas:token');
        localStorage.removeItem('@saas:user');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
