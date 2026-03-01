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
    login: (token: string, user: User, mustChangePassword?: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    mustChangePassword: boolean;
    setMustChangePassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('@saas:token');
        const storedUser = localStorage.getItem('@saas:user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            const storedMustChange = localStorage.getItem('@saas:mustChangePassword');
            if (storedMustChange === 'true') {
                setMustChangePassword(true);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User, changePass: boolean = false) => {
        localStorage.setItem('@saas:token', newToken);
        localStorage.setItem('@saas:user', JSON.stringify(newUser));
        localStorage.setItem('@saas:mustChangePassword', String(changePass));
        setToken(newToken);
        setUser(newUser);
        setMustChangePassword(changePass);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('@saas:token');
        localStorage.removeItem('@saas:user');
        localStorage.removeItem('@saas:mustChangePassword');
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading, mustChangePassword, setMustChangePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
