import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, MoreVertical, Check, X, Building } from 'lucide-react';
import { api } from '../contexts/AuthContext';
import { SettingsModal } from '../components/SettingsModal';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
    status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
    lastLogin?: string;
}

const ROLE_LABELS = {
    'OWNER': 'Proprietário',
    'MANAGER': 'Gerente Geral',
    'CASHIER': 'Caixa / Atendimento',
    'KITCHEN': 'Cozinha / Produção',
    'WAITER': 'Garçom / Mesa',
    'DELIVERY': 'Entregador / Motoboy',
    'ADMIN': 'Administrativo / Financeiro',
    'STOCK': 'Estoquista'
};

const ROLE_COLORS: Record<string, string> = {
    'OWNER': 'bg-purple-100 text-purple-700 border-purple-200',
    'MANAGER': 'bg-blue-100 text-blue-700 border-blue-200',
    'CASHIER': 'bg-green-100 text-green-700 border-green-200',
    'KITCHEN': 'bg-orange-100 text-orange-700 border-orange-200',
    'WAITER': 'bg-pink-100 text-pink-700 border-pink-200',
    'DELIVERY': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'ADMIN': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'STOCK': 'bg-teal-100 text-teal-700 border-teal-200'
};

export function Team() {
    const [team, setTeam] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', role: 'CASHIER' });

    const fetchTeam = async () => {
        try {
            const response = await api.get('/users'); // Use /users instead of /team directly
            // Ensure we handle potential schema differences mapped to Frontend Employee schema
            setTeam(response.data);
        } catch (err) {
            console.error('Erro ao buscar equipe:', err);
            setTeam([]); // Empty list for fresh tenant
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Em um sistema real envia para a API, mas para este MVP mockado
            // já geramos o link do WhatsApp para o cliente
            const message = `Olá ${formData.name}, você foi convidado para acessar o sistema FoodSaaS como ${ROLE_LABELS[formData.role as keyof typeof ROLE_LABELS]}. Acesse o link: http://localhost:5173/login e use seu email ${formData.email} ou este número para o primeiro acesso.`;
            const whatsappUrl = `https://wa.me/${formData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

            // Tenta salvar no backend (ignora em dev se nao existir)
            try {
                await api.post('/users/invite', {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role
                });
            } catch (e) { console.log('Backend not fully ready for invite, opening wpp mockup') }

            window.open(whatsappUrl, '_blank');

            // Simula adição no front
            const newEmployee: Employee = {
                id: `emp${Date.now()}`,
                name: formData.name,
                email: formData.email || formData.phone,
                role: formData.role as Employee['role'],
                status: 'INVITED'
            };
            setTeam([...team, newEmployee]);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', role: 'CASHIER' });
        } catch (error) {
            alert('Erro ao processar convite.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Configurações da Empresa <Shield className="w-6 h-6 text-primary-500" />
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie acessos e papéis dos colaboradores no sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSettingsOpen(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 font-medium transition-all shadow-sm">
                        <Building className="w-4 h-4" />
                        Dados da Empresa
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary-500 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-600 font-bold transition-all shadow-lg shadow-primary-500/30">
                        <UserPlus className="w-5 h-5" />
                        Convidar Membro
                    </button>
                </div>
            </div>

            {/* Listagem de Usuários */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" /> Equipe ({team.length})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="text-xs uppercase bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Usuário</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Nível de Acesso (Cargo)</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Último Acesso</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Opções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {team.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{member.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[member.role]}`}>
                                            {ROLE_LABELS[member.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {member.status === 'ACTIVE' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ativo</span>}
                                        {member.status === 'INVITED' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-600"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Pendente (Convite)</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {member.lastLogin ? (
                                            <>
                                                {new Date(member.lastLogin).toLocaleDateString('pt-BR')} às {new Date(member.lastLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 italic">Nunca acessou</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => alert(`Feature: Opções de ${member.name} em breve!`)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Convidar Membro */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary-500" />
                                Convidar Novo Membro
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Colaborador</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="Ex: Roberto Almeida" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="(00) 90000-0000" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="email@empresa.com" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Função / Cargo</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {[
                                        { id: 'MANAGER', label: 'Gerente Geral', desc: 'Acesso total' },
                                        { id: 'ADMIN', label: 'Administrativo', desc: 'Financeiro e Relatórios' },
                                        { id: 'CASHIER', label: 'Caixa / Atendimento', desc: 'Acesso ao PDV e Vendas' },
                                        { id: 'WAITER', label: 'Garçom', desc: 'Pedidos de Mesa' },
                                        { id: 'KITCHEN', label: 'Cozinha', desc: 'Tela de Preparo (KDS)' },
                                        { id: 'DELIVERY', label: 'Motoboy / Entrega', desc: 'Rotas e Entregas' },
                                        { id: 'STOCK', label: 'Estoquista', desc: 'Gestão de Insumos' }
                                    ].map(role => (
                                        <label
                                            key={role.id}
                                            onClick={() => setFormData({ ...formData, role: role.id })}
                                            className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.role === role.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className="mt-0.5 pointer-events-none">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.role === role.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                                                    {formData.role === role.id && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                            <div className="pointer-events-none">
                                                <div className="font-bold text-gray-900 text-sm">{role.label}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{role.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-colors shadow-md shadow-[#25D366]/20 flex justify-center items-center gap-2">
                                    Enviar Convite via WhatsApp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
