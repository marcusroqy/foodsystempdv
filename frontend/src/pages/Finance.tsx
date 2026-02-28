import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, History, FileText, Plus, X } from 'lucide-react';
import { api } from '../contexts/AuthContext';
import { formatCurrency, parseCurrency } from '../utils/format';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    category: string;
}

export function Finance() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', amount: '', type: 'INCOME', category: 'Vendas' });

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    const fetchFinances = async () => {
        try {
            const response = await api.get('/finances');
            setTransactions(response.data);
        } catch (err) {
            console.error('Erro ao buscar finanças:', err);
            setTransactions([]); // Fallback to empty real state
        }
    };

    useEffect(() => {
        fetchFinances();
    }, []);

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/finances', {
                description: formData.description,
                amount: parseCurrency(formData.amount),
                type: formData.type,
                category: formData.category
            });
            fetchFinances();
            setIsModalOpen(false);
            setFormData({ description: '', amount: '', type: 'INCOME', category: 'Vendas' });
        } catch (error) {
            alert('Erro ao salvar transação. O backend de finanças ainda está sendo implementado conectando o React...');
            setIsModalOpen(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Financeiro</h1>
                    <p className="text-gray-500 mt-1">Acompanhe o fluxo de caixa do seu negócio.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 font-medium transition-all shadow-sm">
                        <FileText className="w-4 h-4" />
                        Exportar Relatório
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary-500 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-600 font-bold transition-all shadow-lg shadow-primary-500/30">
                        <Plus className="w-5 h-5" />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Saldo Total */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-900/20 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">Mês Atual</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Saldo em Caixa</p>
                            <h3 className="text-4xl font-bold tracking-tight">R$ {balance.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                {/* Receitas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            <ArrowUpRight className="w-3 h-3" /> 8.5%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Entradas (Receitas)</p>
                        <h3 className="text-3xl font-bold text-gray-900">R$ {totalIncome.toFixed(2)}</h3>
                    </div>
                </div>

                {/* Despesas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            <ArrowUpRight className="w-3 h-3" /> 2.1%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Saídas (Despesas)</p>
                        <h3 className="text-3xl font-bold text-gray-900">R$ {totalExpense.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Listagem de Transações */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-primary-500" /> Últimas Movimentações
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-left text-sm text-gray-600 hidden md:table">
                        <thead className="text-xs uppercase bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Descrição / Categoria</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Data</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map(transaction => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${transaction.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {transaction.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{transaction.description}</div>
                                                <div className="text-xs text-gray-500">{transaction.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString('pt-BR')} <span className="text-xs opacity-70 ml-1">{new Date(transaction.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {transaction.type === 'INCOME' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col divide-y divide-gray-100">
                        {transactions.map(transaction => (
                            <div key={transaction.id} className="p-4 flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-3 rounded-xl flex-shrink-0 ${transaction.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {transaction.type === 'INCOME' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-gray-900 truncate">{transaction.description}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">{transaction.category}</span>
                                            <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-right font-bold whitespace-nowrap ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {transaction.type === 'INCOME' ? '+' : '-'} <br className="sm:hidden" />
                                    R$ {transaction.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">Nenhuma transação registrada.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Nova Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary-500" />
                                Nova Transação
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'INCOME' })} className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${formData.type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <TrendingUp className="w-5 h-5" /> <span className="font-semibold text-sm">Receita</span>
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'EXPENSE' })} className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${formData.type === 'EXPENSE' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <TrendingDown className="w-5 h-5" /> <span className="font-semibold text-sm">Despesa</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="Ex: Pagamento Fornecedor XYZ" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                    <input type="text" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: formatCurrency(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="R$ 0,00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all">
                                        <option value="Vendas">Vendas</option>
                                        <option value="Delivery">Delivery</option>
                                        <option value="Insumos">Insumos (Entrada)</option>
                                        <option value="Contas">Contas / Fixos</option>
                                        <option value="Fornecedores">Fornecedores</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 text-center">Salvar Lançamento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
