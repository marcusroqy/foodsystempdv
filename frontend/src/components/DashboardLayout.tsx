import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Store, ShoppingCart, PackageSearch, PieChart, LogOut, Settings, Users } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const menuItems = [
        { path: '/pdv', icon: ShoppingCart, label: 'Ponto de Venda' },
        { path: '/estoque', icon: PackageSearch, label: 'Estoque' },
        { path: '/financeiro', icon: PieChart, label: 'Financeiro' },
        { path: '/equipe', icon: Users, label: 'Equipe & Acessos' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar Lateral */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex z-10 shadow-sm relative">
                <div>
                    {/* Logo Area */}
                    <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100 mb-6">
                        <div className="bg-primary-500 text-white p-2 rounded-xl shadow-inner shadow-primary-700/50">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">FoodSaaS</h2>
                            <p className="text-xs text-primary-600 font-medium">Gestão Inteligente</p>
                        </div>
                    </div>

                    {/* Menu Navigation */}
                    <nav className="flex flex-col gap-2 px-4">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                        ? 'bg-primary-50 text-primary-600 shadow-inner'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-3 border border-gray-200/50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsSettingsOpen(true)}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Usuário'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.role === 'OWNER' ? 'Proprietário' : 'Operador'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSettingsOpen(true)} className="flex-1 flex items-center justify-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
                            <LogOut className="w-4 h-4" /> Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 relative pb-20 md:pb-0">
                {children}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50 flex justify-around items-center px-2 py-2 pb-safe">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 w-16 p-2 rounded-xl transition-all ${isActive
                                ? 'text-primary-600'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary-50' : 'bg-transparent'}`}>
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-semibold truncate w-full text-center ${isActive ? 'font-bold' : ''}`}>
                                    {item.label.split(' ')[0]} {/* Simplificando o nome pro mobile */}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Mobile Menu Settings */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 w-16 p-2 rounded-xl transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                >
                    <div className="p-1.5 rounded-xl bg-transparent transition-colors">
                        <Settings className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold truncate w-full text-center">
                        Menu
                    </span>
                </button>
            </nav>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
