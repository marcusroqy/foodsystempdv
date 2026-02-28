import { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { ShoppingCart, LogOut, Plus, Minus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils/format';

interface Product {
    id: string;
    name: string;
    price: number;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
}

interface CartItem extends Product {
    quantity: number;
}

export function PDV() {
    const { user, logout } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // ESTADOS PARA CRUD DE PRODUTOS
    // ==========================================
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({ name: '', price: '', categoryId: '1' });

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

    useEffect(() => {
        fetchDados();
    }, []);

    const fetchDados = async () => {
        try {
            const [catsRes, prodsRes, allProdsRes] = await Promise.all([
                api.get('/categories'),
                api.get('/products'),
                api.get('/products?all=true')
            ]);

            // Prisma Decimal fields come as strings in JSON.
            // We need to parse them to Number so .toFixed() works in the UI.
            const parsedProducts = prodsRes.data.map((p: any) => ({
                ...p,
                price: Number(p.price)
            }));

            setProducts(parsedProducts);

            // Filter purely stock categories
            const pdvCategories = catsRes.data.filter((cat: Category) => {
                const totalProds = allProdsRes.data.filter((p: any) => p.categoryId === cat.id);
                const sellableProds = parsedProducts.filter((p: Product) => p.categoryId === cat.id);

                // Keep if it's a new empty category OR if it has sellable products
                if (totalProds.length === 0) return true;
                if (sellableProds.length > 0) return true;

                // Hide if it has products but NONE are sellable (pure inventory)
                return false;
            });

            setAllCategories(pdvCategories);
            setCategories(pdvCategories);

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = selectedCategory
        ? products.filter(p => p.categoryId === selectedCategory)
        : products;

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQtd = item.quantity + delta;
                return newQtd > 0 ? { ...item, quantity: newQtd } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // ==========================================
    // FUNÇÕES DE CRUD (MOCKADAS)
    // ==========================================
    const openProductModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductForm({ name: product.name, price: formatCurrency(product.price), categoryId: product.categoryId });
        } else {
            setEditingProduct(null);
            setProductForm({ name: '', price: '', categoryId: allCategories[0]?.id || '1' });
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                // await api.put(`/products/${editingProduct.id}`, { ...productForm, price: parseFloat(productForm.price) });
                // Note: Implement PUT on backend if needed, or update local state for now
            } else {
                await api.post('/products', {
                    name: productForm.name,
                    price: parseCurrency(productForm.price),
                    categoryId: productForm.categoryId
                });
            }
            fetchDados(); // Atualiza a lista
            setIsProductModalOpen(false);
        } catch (error) {
            alert('Erro ao salvar produto. Verifique se a categoria existe.');
        }
    };

    const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Evita adicionar ao carrinho por acidente
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await api.delete(`/products/${id}`);
                setProducts(prev => prev.filter(p => p.id !== id));
                removeFromCart(id);
            } catch (error) {
                alert('Erro ao excluir produto.');
            }
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleFinishOrder = async () => {
        if (cart.length === 0) return;
        try {
            const items = cart.map(c => ({ productId: c.id, quantity: c.quantity, unitPrice: c.price }));
            await api.post('/orders', { items, customerName: 'Cliente Balcão' });
            alert('Pedido finalizado com sucesso e salvo no banco de dados!');
            setCart([]);
        } catch (err) {
            alert('Erro ao criar pedido. Tente novamente.');
            console.error(err);
        }
    };

    if (loading) return <div className="h-screen flex text-primary-500 items-center justify-center font-bold">Carregando PDV...</div>;

    return (
        <div className="flex h-full md:h-screen bg-gray-100 font-sans relative overflow-hidden">
            {/* Esquerda: Categorias e Produtos */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Ponto de Venda</h1>
                        <p className="text-gray-500 text-sm mt-1">Olá, {user?.name || 'Operador'}</p>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" /> Sair
                    </button>
                </div>

                {/* Categorias e Botão de Novo Produto */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1 pr-4">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${selectedCategory === null
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${selectedCategory === cat.id
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => openProductModal()}
                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
                    >
                        <Plus className="w-5 h-5" /> Adicionar
                    </button>
                </div>

                {/* Grade de Produtos */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="relative group">
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full h-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all flex flex-col items-center justify-center text-center active:scale-95"
                                >
                                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                                        <span className="text-2xl font-bold text-primary-600">
                                            {product.name.charAt(0)}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                                    <p className="text-primary-600 font-bold mt-1">R$ {product.price.toFixed(2)}</p>
                                </button>

                                {/* Ações de Edição e Exclusão (Apenas no Hover) */}
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openProductModal(product); }} className="p-2 bg-white rounded-full shadow border border-gray-100 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => handleDeleteProduct(e, product.id)} className="p-2 bg-white rounded-full shadow border border-gray-100 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                                <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                                <p>Nenhum produto cadastrado nesta categoria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Direita: Carrinho (Desktop) / Bottom Sheet (Mobile) */}
            <div className={`
                fixed inset-0 z-40 bg-white flex flex-col transition-transform duration-300
                md:relative md:w-96 md:border-l md:border-gray-200 md:shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] md:transform-none md:z-auto
                ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-primary-500" />
                        <h2 className="text-xl font-bold text-gray-800">Pedido Atual</h2>
                    </div>
                    <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                            <p>O carrinho está vazio</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4 items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                                        <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-all">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-600 font-medium">Total</span>
                        <span className="text-3xl font-bold text-gray-900">R$ {total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleFinishOrder}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Finalizar Pedido
                    </button>
                </div>
            </div>

            {/* Botão Flutuante (FAB) do Carrinho Mobile */}
            {!isMobileCartOpen && cart.length > 0 && (
                <button
                    onClick={() => setIsMobileCartOpen(true)}
                    className="md:hidden fixed bottom-[90px] right-4 bg-primary-500 text-white rounded-2xl p-4 shadow-[0_10px_25px_-5px_rgba(var(--color-primary-500),0.4)] z-30 flex items-center gap-3 hover:bg-primary-600 transition-all active:scale-95"
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary-500">
                            {cart.length}
                        </span>
                    </div>
                    <span className="font-bold">Ver Pedido</span>
                </button>
            )}

            {/* Modal de CRUD de Produto */}
            {
                isProductModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h2>
                                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                                    <input
                                        type="text" required
                                        value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="Ex: Pastel Especial"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                        <input
                                            type="text" required
                                            value={productForm.price} onChange={e => setProductForm({ ...productForm, price: formatCurrency(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                            <select
                                                value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all"
                                            >
                                                {allCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setIsCategoryModalOpen(true); setNewCategoryName(''); }}
                                            className="px-3 py-2 mb-0.5 border border-gray-300 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                            title="Nova Categoria"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 text-center">
                                        Salvar Produto
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal para Nova Categoria */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">Nova Categoria</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                                <input
                                    type="text" autoFocus
                                    value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-800"
                                    placeholder="Ex: Combos, Adicionais..."
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && newCategoryName.trim()) {
                                            e.preventDefault();
                                            try {
                                                await api.post('/categories', { name: newCategoryName.trim() });
                                                fetchDados();
                                                setIsCategoryModalOpen(false);
                                                setNewCategoryName('');
                                            } catch (err) { alert('Erro ao criar categoria') }
                                        }
                                    }}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (newCategoryName.trim()) {
                                            try {
                                                await api.post('/categories', { name: newCategoryName.trim() });
                                                fetchDados();
                                                setIsCategoryModalOpen(false);
                                                setNewCategoryName('');
                                            } catch (err) { alert('Erro ao criar categoria') }
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 text-center"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
