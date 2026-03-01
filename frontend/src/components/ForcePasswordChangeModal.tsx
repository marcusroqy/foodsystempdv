import { useState } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { KeyRound, Lock, LogOut, CheckCircle } from 'lucide-react';

export function ForcePasswordChangeModal() {
    const { logout, setMustChangePassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        try {
            setLoading(true);
            await api.put('/users/profile/password', { newPassword });
            setSuccess('Senha atualizada com sucesso!');

            // Dá um respiro pro usuário ver o sucesso antes de fechar
            setTimeout(() => {
                setMustChangePassword(false);
                localStorage.setItem('@saas:mustChangePassword', 'false');
            }, 1000);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Segurança da Conta</h2>
                    <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                        Detectamos que você está usando a senha provisória padrão. Para sua segurança, defina uma nova senha exclusiva.
                    </p>
                </div>

                {error && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                                disabled={!!success || loading}
                            />
                            <KeyRound className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirme a Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                                disabled={!!success || loading}
                            />
                            <KeyRound className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg disabled:opacity-70"
                        >
                            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            disabled={loading || !!success}
                            className="w-full py-2 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair da Conta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
