import { useState, useMemo, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownRight, Search, AlertTriangle, Activity, PieChart, PackageSearch, X, Edit2, Loader2 } from 'lucide-react';
import { api } from '../contexts/AuthContext';
import { formatQuantity, parseQuantity } from '../utils/format';

interface StockItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unit: string;
    lastUpdated: string;
    status: 'GOOD' | 'LOW' | 'OUT';
    categoryName: string;
    categoryId?: string;
}

export function Inventory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [adjustForm, setAdjustForm] = useState({ type: 'IN', quantity: '', reason: '' });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', categoryId: '' });
    const [dbCategories, setDbCategories] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await api.get('/inventory');
                const catResponse = await api.get('/categories');

                setDbCategories(catResponse.data);

                // Keep categoryId around for edits
                const withCatIds = response.data.map((item: any) => ({
                    ...item,
                    categoryId: catResponse.data.find((c: any) => c.name === item.categoryName)?.id
                }));
                setItems(withCatIds);
            } catch (err: any) {
                console.error('Erro ao buscar estoque:', err);
                alert('Erro ao carregar estoque: ' + (err.message || 'Desconhecido'));
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? item.categoryName === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    const categories = Array.from(new Set(items.map(i => i.categoryName)));

    const outOfStockCount = items.filter(i => i.status === 'OUT').length;
    const lowStockCount = items.filter(i => i.status === 'LOW').length;
    const totalValueMock = "R$ 0,00"; // Fake info for styling purposes

    const openAdjustModal = (item: StockItem) => {
        setSelectedItem(item);
        setAdjustForm({ type: 'IN', quantity: '', reason: 'Ajuste Manual' });
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/inventory/adjust', {
                productId: selectedItem?.id,
                type: adjustForm.type,
                quantity: parseQuantity(adjustForm.quantity),
                reason: adjustForm.reason
            });
            setIsAdjustModalOpen(false);
            window.location.reload(); // Simple reload to refresh data
        } catch (error) {
            alert('Erro ao ajustar estoque.');
        }
    };

    const openEditModal = (item: StockItem) => {
        setSelectedItem(item);
        setEditForm({ name: item.name, categoryId: item.categoryId || '' });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/products/${selectedItem?.id}`, {
                name: editForm.name,
                categoryId: editForm.categoryId || null
            });
            setIsEditModalOpen(false);
            window.location.reload();
        } catch (error) {
            alert('Erro ao editar item.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Controle de Estoque</h1>
                    <p className="text-gray-500 mt-1">Gerencie os insumos da sua operação em tempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 font-medium transition-all shadow-sm">
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                        Saída (Perda)
                    </button>
                    <button className="bg-primary-500 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-600 font-bold transition-all shadow-lg shadow-primary-500/30">
                        <ArrowUpRight className="w-5 h-5" />
                        Entrada de NF
                    </button>
                </div>
            </div>

            {/* Cards de Resumo (Estilo Dashboard) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Package className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">+12% hj</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-bold text-gray-900">{items.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500 mb-1">Ruptura (Sem Estoque)</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-bold text-gray-900">{outOfStockCount}</h3>
                            <span className="text-sm text-red-500 font-medium mb-1 line-clamp-1">itens vazios</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 bg-yellow-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500 mb-1">Estoque Crítico</p>
                        <h3 className="text-3xl font-bold text-gray-900">{lowStockCount}</h3>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-900/20 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <PieChart className="w-32 h-32 transform translate-x-4 space-y-4" />
                    </div>
                    <div className="relative z-10 mb-4">
                        <p className="text-sm font-medium text-gray-400 mb-1">Custo Total Imobilizado</p>
                        <h3 className="text-3xl font-bold tracking-tight">{totalValueMock}</h3>
                    </div>
                    <button className="relative z-10 w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium text-white flex justify-center items-center gap-2 backdrop-blur-sm">
                        Ver Relatório Financeiro <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Listagem e Filtros */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header da Tabela */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <PackageSearch className="w-5 h-5 text-primary-500" /> Itens Cadastrados
                    </h2>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm bg-white text-sm"
                        >
                            <option value="">Todas as Categorias</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabela de Dados */}
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-left text-sm text-gray-600 hidden md:table">
                        <thead className="text-xs uppercase bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Item / SKU</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Quantidade</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Categoria</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Última Movimentação</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-primary-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="font-medium">Carregando estoque...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 mb-0.5">{item.name}</div>
                                        <div className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                                            <span className="text-gray-500 text-xs">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                            {item.categoryName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'GOOD' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Adequado</span>}
                                        {item.status === 'LOW' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Comprar</span>}
                                        {item.status === 'OUT' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Em Ruptura</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(item.lastUpdated).toLocaleDateString('pt-BR')} às {new Date(item.lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(item)} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openAdjustModal(item)} className="text-primary-600 font-medium hover:text-primary-800 text-sm bg-primary-50 px-3 py-1.5 rounded-lg">
                                                Ajustar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum item encontrado na busca.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-primary-500 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Carregando estoque...</span>
                            </div>
                        ) : filteredItems.map(item => (
                            <div key={item.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900 mb-0.5">{item.name}</div>
                                        <div className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">{item.sku}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                                            <span className="text-gray-500 text-xs">{item.unit}</span>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 mt-1 line-clamp-1">
                                            {item.categoryName}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        {item.status === 'GOOD' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Adequado</span>}
                                        {item.status === 'LOW' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Comprar</span>}
                                        {item.status === 'OUT' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Ruptura</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditModal(item)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100" title="Editar">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openAdjustModal(item)} className="text-primary-600 font-medium text-sm bg-primary-50 px-4 py-2 rounded-lg active:scale-95 transition-transform border border-primary-100">
                                            Ajustar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!loading && filteredItems.length === 0 && (
                            <div className="p-12 text-center text-gray-400">
                                Nenhum item encontrado na busca.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Ajuste de Estoque */}
            {isAdjustModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Ajustar: {selectedItem.name}</h2>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-3 mb-2">
                                <button type="button" onClick={() => setAdjustForm({ ...adjustForm, type: 'IN' })} className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${adjustForm.type === 'IN' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <ArrowUpRight className="w-5 h-5" /> <span className="font-semibold text-sm text-center">Entrada<br />(Somar)</span>
                                </button>
                                <button type="button" onClick={() => setAdjustForm({ ...adjustForm, type: 'OUT' })} className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${adjustForm.type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <ArrowDownRight className="w-5 h-5" /> <span className="font-semibold text-sm text-center">Saída<br />(Subtrair)</span>
                                </button>
                                <button type="button" onClick={() => setAdjustForm({ ...adjustForm, type: 'SET' })} className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${adjustForm.type === 'SET' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <Edit2 className="w-5 h-5" /> <span className="font-semibold text-sm text-center">Corrigir<br />(Exato)</span>
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {adjustForm.type === 'SET' ? 'Nova Quantidade Exata' : 'Quantidade para Ajustar'}
                                </label>
                                <input type="text" required value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: formatQuantity(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Ex: 5 ou 1,5" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do Ajuste</label>
                                <input type="text" value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Ex: Quebra, Venda manual, Corrigir saldo" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 text-center">Confirmar Ajuste</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edição de Item */}
            {isEditModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Editar Item</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-all">
                                    <option value="">Selecione uma categoria...</option>
                                    {dbCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 text-center">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
