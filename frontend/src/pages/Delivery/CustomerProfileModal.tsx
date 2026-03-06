import { useState, useEffect } from 'react';

import { User, LogOut, Key, Save, X, Lock, Phone } from 'lucide-react';
import { api } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CustomerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string;
}

export function CustomerProfileModal({ isOpen, onClose, slug }: CustomerProfileModalProps) {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('@FoodSystem:CustomerToken');

    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['customer-profile', slug],
        queryFn: async () => {
            const res = await api.get(`/delivery/${slug}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: isOpen && !!token && !!slug,
    });

    useEffect(() => {
        if (profile) {
            setName(profile.name);
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.put(`/delivery/${slug}/profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            alert('Perfil atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['customer-profile', slug] });
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Erro ao atualizar perfil.');
        }
    });

    const handleSave = () => {
        if (!name.trim()) return alert('O nome é obrigatório.');

        const data: any = { name };

        if (isEditingPassword) {
            if (!currentPassword) return alert('Digite a senha atual.');
            if (newPassword.length < 6) return alert('A nova senha deve ter no mínimo 6 caracteres.');
            if (newPassword !== confirmPassword) return alert('As senhas não coincidem.');

            data.currentPassword = currentPassword;
            data.newPassword = newPassword;
        }

        updateProfileMutation.mutate(data);
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
        }
        return phone;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-xl flex flex-col max-h-[90vh] pb-safe animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl relative">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-500" />
                        Meu Perfil
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {/* Decorative Top Pill for Mobile swipe */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 sm:hidden"></div>
                </div>

                {isLoading ? (
                    <div className="p-10 flex justify-center text-primary-500">
                        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="p-5 overflow-y-auto space-y-6">

                        {/* Dados Básicos */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Telefone (Fixo)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formatPhone(profile?.phone)}
                                        disabled
                                        className="w-full bg-gray-50 border-0 pl-11 pr-4 py-3.5 rounded-2xl text-gray-500 font-bold placeholder-gray-400 ring-1 ring-inset ring-gray-200"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 ml-2">Usado no login. Não pode ser alterado.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl text-gray-900 font-bold placeholder-gray-400 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Alterar Senha Toggle */}
                        {!isEditingPassword ? (
                            <button
                                onClick={() => setIsEditingPassword(true)}
                                className="w-full py-3.5 rounded-2xl font-bold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Key className="w-5 h-5" />
                                Alterar minha Senha
                            </button>
                        ) : (
                            <div className="space-y-4 bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                                <div className="flex justify-between items-center border-b border-orange-200/50 pb-2 mb-2">
                                    <h3 className="font-bold text-orange-900 flex items-center gap-2 text-sm">
                                        <Lock className="w-4 h-4 text-orange-500" />
                                        Segurança
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingPassword(false)}
                                        className="text-xs font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1 ml-1">Senha Atual</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        placeholder="Digite a senha atual"
                                        className="w-full bg-white px-4 py-3.5 rounded-2xl text-gray-900 font-bold placeholder-gray-400 ring-1 ring-inset ring-orange-200 focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1 ml-1">Nova Senha</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Nova"
                                            className="w-full bg-white px-4 py-3.5 rounded-2xl text-gray-900 font-bold placeholder-gray-400 ring-1 ring-inset ring-orange-200 focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1 ml-1">Confirmar</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repita"
                                            className="w-full bg-white px-4 py-3.5 rounded-2xl text-gray-900 font-bold placeholder-gray-400 ring-1 ring-inset ring-orange-200 focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-white grid grid-cols-[1fr_2fr] gap-3 shrink-0 rounded-b-3xl">
                    <button
                        onClick={() => {
                            if (window.confirm('Tem certeza que deseja sair? Você precisará fazer login novamente para acompanhar os pedidos.')) {
                                localStorage.removeItem('@FoodSystem:CustomerToken');
                                localStorage.removeItem('@FoodSystem:Customer');
                                window.location.reload();
                            }
                        }}
                        className="py-4 bg-gray-50 text-red-500 hover:bg-red-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-gray-200 hover:border-red-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending || isLoading}
                        className="py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-primary-600/30"
                    >
                        {updateProfileMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Salvar Dados
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
