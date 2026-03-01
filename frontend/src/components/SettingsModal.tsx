import { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { X, User, Building, Shield, Bell, CreditCard, Save, Loader2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'security' | 'notifications' | 'billing'>('profile');

    const [profileName, setProfileName] = useState(user?.name || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [companyData, setCompanyData] = useState({ name: '', document: '', phone: '', address: '' });
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [isSavingCompany, setIsSavingCompany] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === 'company' && user?.role !== 'CASHIER' && user?.role !== 'KITCHEN') {
            loadCompanyData();
        }
    }, [isOpen, activeTab]);

    const loadCompanyData = async () => {
        try {
            setIsLoadingCompany(true);
            const response = await api.get('/tenant');
            setCompanyData({
                name: response.data.name || '',
                document: response.data.document || '',
                phone: response.data.phone || '',
                address: response.data.address || ''
            });
        } catch (error) {
            console.error('Erro ao carregar dados da empresa:', error);
        } finally {
            setIsLoadingCompany(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setIsSavingProfile(true);
            await api.put('/users/profile', { name: profileName });
            alert('Perfil atualizado com sucesso! (Recarregue para ver efeito em todo o app)');
        } catch (error) {
            alert('Erro ao atualizar perfil.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveCompany = async () => {
        try {
            setIsSavingCompany(true);
            await api.put('/tenant', companyData);
            alert('Dados da empresa atualizados com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar dados da empresa.');
        } finally {
            setIsSavingCompany(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 md:p-12 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] md:h-full md:max-h-[800px] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Sidebar de Configurações */}
                <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center md:block">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
                            <p className="text-sm text-gray-500 mt-1 hidden md:block">Gerencie sua conta e sistema</p>
                        </div>
                        {/* Close button on mobile */}
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu com scroll horizontal no mobile */}
                    <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-4 gap-2 md:gap-1 md:space-y-1 custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <User className="w-4 h-4 md:w-5 md:h-5" /> Meu Perfil
                        </button>

                        {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                            <button
                                onClick={() => setActiveTab('company')}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Building className="w-4 h-4 md:w-5 md:h-5" /> Dados da Empresa
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Shield className="w-4 h-4 md:w-5 md:h-5" /> Segurança
                        </button>

                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Bell className="w-4 h-4 md:w-5 md:h-5" /> Notificações
                        </button>

                        {user?.role === 'OWNER' && (
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <CreditCard className="w-4 h-4 md:w-5 md:h-5" /> Assinatura
                            </button>
                        )}
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="hidden md:flex h-16 items-center justify-end px-6 border-b border-gray-100">
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-2xl mx-auto pb-6 md:pb-0">

                            {/* Aba: Meu Perfil */}
                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Meu Perfil</h3>
                                        <p className="text-gray-500 mt-1">Atualize suas informações pessoais.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg shrink-0">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                                Alterar Foto
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                            <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                            <input type="email" defaultValue={user?.email} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none" />
                                            <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado.</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                            <input type="text" defaultValue={user?.role === 'OWNER' ? 'Proprietário' : user?.role} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none" />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex justify-end pb-8 md:pb-0">
                                        <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full md:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                                            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Aba: Empresa */}
                            {activeTab === 'company' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Dados da Empresa</h3>
                                        <p className="text-gray-500 mt-1">Configure os dados do seu estabelecimento.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia (Tenant)</label>
                                            <input type="text" value={companyData.name} onChange={e => setCompanyData({ ...companyData, name: e.target.value })} placeholder="Nome do seu negócio" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                            <input type="text" value={companyData.document} onChange={e => setCompanyData({ ...companyData, document: e.target.value })} placeholder="00.000.000/0001-00" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                                            <input type="text" value={companyData.phone} onChange={e => setCompanyData({ ...companyData, phone: e.target.value })} placeholder="(11) 90000-0000" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                                            <input type="text" value={companyData.address} onChange={e => setCompanyData({ ...companyData, address: e.target.value })} placeholder="Rua, Número, Bairro, Cidade" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex justify-end pb-8 md:pb-0">
                                        <button onClick={handleSaveCompany} disabled={isSavingCompany || isLoadingCompany} className="w-full md:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                                            {isSavingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSavingCompany ? 'Salvando...' : 'Salvar Empresa'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Aba: Segurança */}
                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Segurança</h3>
                                        <p className="text-gray-500 mt-1">Gerencie sua senha e segurança da conta.</p>
                                    </div>

                                    <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50">
                                        <h4 className="font-bold text-gray-900 mb-4">Alterar Senha</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                            </div>
                                            <button className="w-full md:w-auto px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors mt-2">
                                                Atualizar Senha
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 border border-red-200 rounded-2xl bg-red-50/50 mb-8 md:mb-0">
                                        <h4 className="font-bold text-red-700 mb-2">Zona de Perigo</h4>
                                        <p className="text-sm text-red-600 mb-4">Atenção ao realizar as ações abaixo, elas podem ser irreversíveis.</p>
                                        <button className="w-full md:w-auto px-4 py-2 border border-red-300 text-red-600 bg-white hover:bg-red-50 font-medium rounded-lg transition-colors text-sm">
                                            Desativar Conta
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Placeholders for others */}
                            {(activeTab === 'notifications' || activeTab === 'billing') && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        {activeTab === 'notifications' ? <Bell className="w-10 h-10 text-gray-400" /> : <CreditCard className="w-10 h-10 text-gray-400" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Em Desenvolvimento</h3>
                                    <p className="text-gray-500 max-w-sm">Esta funcionalidade está sendo construída e estará disponível na próxima atualização do sistema.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
