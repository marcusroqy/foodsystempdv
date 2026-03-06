import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../contexts/AuthContext';
import { ShoppingCart, LogOut, Plus, Minus, Trash2, Edit2, X, AlertCircle, Loader2, CheckCircle2, CreditCard, Banknote, Smartphone, MessageSquare } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils/format';

interface Product {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    isForSale?: boolean;
    isStockControlled?: boolean;
    imageUrl?: string;
}

interface Category {
    id: string;
    name: string;
}

interface CartItem extends Product {
    quantity: number;
    notes?: string;
}

export function PDV() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('@saas:cart');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // ==========================================
    // BUSCA DE DADOS COM REACT QUERY CACHE
    // ==========================================
    const { data: pdvData, isLoading: loading } = useQuery({
        queryKey: ['pdv-data'],
        queryFn: async () => {
            const [catsRes, prodsRes, allProdsRes] = await Promise.all([
                api.get('/categories?type=MENU'),
                api.get('/products'),
                api.get('/products?all=true')
            ]);

            const parsedProducts = prodsRes.data.map((p: any) => ({
                ...p,
                price: Number(p.price)
            }));

            const pdvCategories = catsRes.data.filter((cat: Category) => {
                const totalProds = allProdsRes.data.filter((p: any) => p.categoryId === cat.id);
                const sellableProds = parsedProducts.filter((p: Product) => p.categoryId === cat.id);
                if (totalProds.length === 0) return true;
                if (sellableProds.length > 0) return true;
                return false;
            });

            return {
                products: parsedProducts as Product[],
                categories: pdvCategories as Category[],
                allCategories: pdvCategories as Category[]
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const products = pdvData?.products || [];
    const categories = pdvData?.categories || [];
    const allCategories = pdvData?.allCategories || [];

    const filteredProducts = selectedCategory
        ? products.filter(p => p.categoryId === selectedCategory)
        : products;

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1, notes: '' }];
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

    const updateItemNotes = (id: string, notes: string) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
    };

    // ==========================================
    // FUNÇÕES DE CRUD (MOCKADAS)
    // ==========================================
    const openProductModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            // Defaulting toggles to true for existing products since they aren't returned currently, but ideally we'd load them
            setProductForm({
                name: product.name,
                price: formatCurrency(product.price.toFixed(2)),
                categoryId: product.categoryId,
                isForSale: product.isForSale ?? true,
                isStockControlled: product.isStockControlled ?? false,
                imageUrl: product.imageUrl || ''
            });
        } else {
            setEditingProduct(null);
            setProductForm({ name: '', price: '', categoryId: allCategories[0]?.id || '1', isForSale: true, isStockControlled: false, imageUrl: '' });
        }
        setIsProductModalOpen(true);
    };

    // Fix Missing States (re-insert)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({ name: '', price: '', categoryId: '1', isForSale: true, isStockControlled: false, imageUrl: '' });
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Checkout Modal State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({ customerName: '', paymentMethod: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        localStorage.setItem('@saas:cart', JSON.stringify(cart));
    }, [cart]);

    const saveProductMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingProduct) {
                return api.put(`/products/${editingProduct.id}`, data);
            }
            return api.post('/products', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdv-data'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            setIsProductModalOpen(false);
        },
        onError: () => {
            alert('Erro ao salvar produto. Verifique se a categoria existe.');
        }
    });

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        saveProductMutation.mutate({
            name: productForm.name,
            price: parseCurrency(productForm.price),
            categoryId: productForm.categoryId,
            isForSale: productForm.isForSale,
            isStockControlled: productForm.isStockControlled,
            imageUrl: productForm.imageUrl || null
        });
    };

    const deleteProductMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/products/${id}`),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['pdv-data'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            removeFromCart(id);
        },
        onError: () => alert('Erro ao excluir produto.')
    });

    const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Evita adicionar ao carrinho por acidente
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            deleteProductMutation.mutate(id);
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const openCheckout = () => {
        if (cart.length === 0) return;
        setCheckoutForm({ customerName: '', paymentMethod: '', notes: '' });
        setIsCheckoutOpen(true);
    };

    const handleFinishOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const items = cart.map(c => ({ productId: c.id, quantity: c.quantity, unitPrice: c.price, notes: c.notes || undefined }));
            await api.post('/orders', {
                items,
                customerName: checkoutForm.customerName || 'Cliente Balcão',
                paymentMethod: checkoutForm.paymentMethod || undefined,
                notes: checkoutForm.notes || undefined
            });

            setCart([]);
            localStorage.removeItem('@saas:cart');
            setIsMobileCartOpen(false);
            setIsCheckoutOpen(false);
            setIsSuccessModalOpen(true);
        } catch (err) {
            alert('Erro ao criar pedido. Tente novamente.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-full md:h-screen bg-gray-100 font-sans relative overflow-hidden">
            {/* Esquerda: Categorias e Produtos */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-3 md:mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ponto de Venda</h1>
                        <p className="hidden md:block text-gray-500 text-sm mt-1">Olá, {user?.name || 'Operador'}</p>
                    </div>
                    <button onClick={logout} className="hidden md:flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" /> Sair
                    </button>
                </div>

                {/* Categorias e Botão de Novo Produto */}
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1 pr-2 md:pr-4">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base whitespace-nowrap font-medium transition-all ${selectedCategory === null
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
                                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base whitespace-nowrap font-medium transition-all ${selectedCategory === cat.id
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
                        className="flex items-center justify-center gap-2 bg-gray-900 text-white w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-5 h-5 md:w-5 md:h-5" />
                        <span className="hidden md:inline">Adicionar</span>
                    </button>
                </div>

                {/* Grade de Produtos */}
                <div className="flex-1 overflow-y-auto pb-24 md:pb-0 pr-1 md:pr-2 scrollbar-hide">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="relative group overflow-hidden">
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full h-full bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all flex flex-col items-center justify-center text-center active:scale-95 group/card relative"
                                >
                                    {product.imageUrl ? (
                                        <div className="w-16 h-16 md:w-20 md:h-20 mb-2 md:mb-3 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-50 rounded-full flex flex-shrink-0 items-center justify-center mb-2 md:mb-3 group-hover:bg-primary-100 transition-colors">
                                            <span className="text-xl md:text-2xl font-bold text-primary-600">
                                                {product.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between w-full mt-1">
                                        <h3 className="text-sm md:text-[15px] font-bold text-gray-800 line-clamp-2 leading-snug mb-1">{product.name}</h3>
                                        <p className="text-primary-600 font-black text-sm md:text-[17px]">R$ {product.price.toFixed(2)}</p>
                                    </div>
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

                        {loading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-primary-500 gap-3">
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <span className="font-medium">Carregando produtos...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                                <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                                <p>Nenhum produto cadastrado nesta categoria.</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Direita: Carrinho (Desktop) / Bottom Sheet (Mobile) */}
            <div className={`
                fixed inset-0 z-40 bg-white flex flex-col transition-transform duration-300 pb-24 pb-safe
                md:relative md:w-96 md:border-l md:border-gray-200 md:shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] md:transform-none md:pb-0 md:z-auto
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
                                <div key={item.id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4 items-center">
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
                                    {/* Per-item notes */}
                                    <div className="mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare className="w-3 h-3 text-gray-400" />
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={e => updateItemNotes(item.id, e.target.value)}
                                                className="w-full text-xs px-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-400 outline-none text-gray-600 placeholder-gray-300"
                                                placeholder="Obs: sem cebola, extra queijo..."
                                            />
                                        </div>
                                    </div>
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
                        onClick={openCheckout}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Opcional)</label>
                                    <input
                                        type="url"
                                        value={productForm.imageUrl} onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="https://imgur.com/foto.jpg"
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
                                            disabled={!productForm.isForSale} // Disable price if not for sale
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

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={productForm.isForSale}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setProductForm({ ...productForm, isForSale: checked, price: checked ? productForm.price : '0,00' });
                                            }}
                                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">Vender no PDV</span>
                                            <span className="text-xs text-gray-500">Aparece para vendas</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={productForm.isStockControlled}
                                            onChange={(e) => setProductForm({ ...productForm, isStockControlled: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">Controlar Estoque</span>
                                            <span className="text-xs text-gray-500">Aba de inventário</span>
                                        </div>
                                    </label>
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
                                                await api.post('/categories', { name: newCategoryName.trim(), type: 'MENU' });
                                                queryClient.invalidateQueries({ queryKey: ['pdv-data'] });
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
                                                await api.post('/categories', { name: newCategoryName.trim(), type: 'MENU' });
                                                queryClient.invalidateQueries({ queryKey: ['pdv-data'] });
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

            {/* Modal de Checkout */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary-500 to-primary-600">
                            <h2 className="text-xl font-bold text-white">Finalizar Pedido</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Resumo do pedido */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumo do Pedido</h3>
                                <div className="space-y-2">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-800">{item.quantity}x {item.name}</span>
                                                {item.notes && <span className="text-xs text-gray-400 ml-2">— {item.notes}</span>}
                                            </div>
                                            <span className="text-gray-600 font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Total</span>
                                    <span className="text-2xl font-black text-gray-900">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Nome do Cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente (opcional)</label>
                                <input
                                    type="text"
                                    value={checkoutForm.customerName}
                                    onChange={e => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Ex: João, Mesa 3, Delivery..."
                                />
                            </div>

                            {/* Forma de Pagamento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'Dinheiro', icon: <Banknote className="w-5 h-5" />, active: 'border-green-500 bg-green-50 text-green-700 shadow-sm' },
                                        { value: 'PIX', icon: <Smartphone className="w-5 h-5" />, active: 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' },
                                        { value: 'Cartão Débito', icon: <CreditCard className="w-5 h-5" />, active: 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' },
                                        { value: 'Cartão Crédito', icon: <CreditCard className="w-5 h-5" />, active: 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' },
                                    ].map(method => (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method.value })}
                                            className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-medium ${checkoutForm.paymentMethod === method.value
                                                ? method.active
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {method.icon}
                                            {method.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Observação do Pedido */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observação do Pedido (opcional)</label>
                                <textarea
                                    value={checkoutForm.notes}
                                    onChange={e => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    placeholder="Ex: Entregar na mesa 5, Troco para R$ 50..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setIsCheckoutOpen(false)}
                                className="flex-1 py-3 text-gray-600 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleFinishOrder}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Sucesso (Pedido Finalizado) */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center p-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease-in-out]">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Pedido Realizado!</h2>
                        <p className="text-gray-500 mb-8">A venda foi registrada com sucesso no sistema e já está no seu histórico.</p>
                        <button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
                        >
                            Novo Pedido
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
