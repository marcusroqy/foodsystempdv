import { useState } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { Store, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [document, setDocument] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isLogin) {
                const response = await api.post('/auth/login', { email, password });
                login(response.data.token, response.data.user, response.data.mustChangePassword);
                navigate('/pdv');
            } else {
                const response = await api.post('/auth/register', {
                    name,
                    email,
                    password,
                    tenantName,
                    document
                });
                login(response.data.token, response.data.user);
                navigate('/pdv');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-primary-100 rounded-full mb-4">
                        <Store className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Acesse o Sistema' : 'Crie sua Conta'}</h2>
                    <p className="text-gray-500">{isLogin ? 'Gerencie sua loja de forma simples.' : 'Comece a gerenciar seu estabelecimento hoje.'}</p>
                </div>

                {error && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
                                <input
                                    type="text"
                                    value={tenantName}
                                    onChange={(e) => setTenantName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="Ex: Pastelaria da Virgínia"
                                    required={!isLogin}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ/CPF</label>
                                <input
                                    type="text"
                                    value={document}
                                    onChange={(e) => setDocument(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="00.000.000/0001-00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome (Proprietário)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="João Silva"
                                    required={!isLogin}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <KeyRound className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 focus:ring-4 focus:ring-primary-300 text-white font-semibold rounded-lg transition-all disabled:opacity-70 mt-2 shadow-md shadow-primary-500/20"
                    >
                        {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
