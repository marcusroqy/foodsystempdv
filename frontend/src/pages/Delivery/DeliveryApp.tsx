import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDelivery } from '../../contexts/DeliveryContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../contexts/AuthContext';
import type { DeliveryCategory, DeliveryProduct } from '../../contexts/DeliveryContext';
import { X, Plus, Minus, ShoppingBag, Clock, CheckCircle2, PlayCircle, Package, Navigation, User } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { CustomerProfileModal } from './CustomerProfileModal';

export function DeliveryApp() {
    const { slug } = useParams();
    const { fetchMenu, tenant, menu, cart, cartTotal, cartCount, addToCart, removeFromCart, updateCartItem, isLoading, error, customer } = useDelivery();

    // UI State
    const [selectedProduct, setSelectedProduct] = useState<DeliveryProduct | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        if (slug) fetchMenu(slug);
    }, [slug]);

    // Active Orders Query for Logged-in Customer
    const token = localStorage.getItem('@FoodSystem:CustomerToken');
    const { data: myOrders = [] } = useQuery({
        queryKey: ['my-delivery-orders', slug, customer?.id],
        queryFn: async () => {
            if (!slug || !token) return [];
            const res = await api.get(`/delivery/${slug}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Hides CANCELED and COMPLETED (Entregue) after some time, but keeps active ones.
            return res.data.filter((o: any) => o.status !== 'CANCELED' && o.status !== 'COMPLETED');
        },
        enabled: !!slug && !!token && !!customer,
        refetchInterval: 15000 // Polling every 15s to see if kitchen prepared it
    });

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Cardápio...</div>;
    }

    if (error || !tenant) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">{error || 'Loja não encontrada'}</div>;
    }

    const handleOpenProduct = (product: DeliveryProduct) => {
        setSelectedProduct(product);
        setQuantity(1);
        setNotes('');
    };

    const handleAddToCart = () => {
        if (selectedProduct) {
            addToCart(selectedProduct, quantity, notes);
            setSelectedProduct(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Banner da Loja */}
            <div className="bg-primary-600 text-white p-6 shadow-md rounded-b-3xl relative overflow-hidden flex justify-between items-start">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black">{tenant.name}</h1>
                    <p className="opacity-80 text-sm mt-1">{tenant.address || 'Delivery & Retirada'}</p>
                </div>
                {customer && (
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="relative z-10 bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <User className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Rastreador de Pedidos Ativos (Se houver) */}
            {myOrders.length > 0 && (
                <div className="px-4 mt-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        {myOrders.map((order: any) => (
                            <div key={order.id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            Pedido #{order.id.slice(-4).toUpperCase()}
                                        </h3>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {order.orderType === 'DELIVERY' ? 'Vou Receber em Casa' : 'Vou Retirar no Balcão'} • R$ {Number(order.totalAmount).toFixed(2)}
                                        </span>
                                    </div>
                                    {order.status === 'QUEUE' && (
                                        <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex gap-1.5 items-center"><Clock className="w-3 h-3" /> Na Fila</span>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex gap-1.5 items-center"><PlayCircle className="w-3 h-3 animate-pulse" /> Preparando</span>
                                    )}
                                    {order.status === 'READY' && order.orderType === 'DELIVERY' && (
                                        <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex gap-1.5 items-center"><Package className="w-3 h-3" /> Pronto (Expedição)</span>
                                    )}
                                    {order.status === 'DISPATCHED' && order.orderType === 'DELIVERY' && (
                                        <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex gap-1.5 items-center"><Navigation className="w-3 h-3" /> Saiu p/ Entrega</span>
                                    )}
                                    {order.status === 'COMPLETED' && order.orderType !== 'DELIVERY' && (
                                        <span className="bg-green-100 text-green-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex gap-1.5 items-center"><CheckCircle2 className="w-3 h-3" /> Pronto p/ Retirar</span>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    {order.items.slice(0, 3).map((it: any) => (
                                        <div key={it.id} className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="font-bold text-gray-400">{it.quantity}x</span> {it.product.name}
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="text-xs text-gray-400 font-medium">+ {order.items.length - 3} itens</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categorias e Produtos */}
            <div className="p-4 space-y-6 mt-4">
                {menu.map((category: DeliveryCategory) => (
                    <div key={category.id}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{category.name}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {category.products.map((product: DeliveryProduct) => (
                                <div key={product.id} onClick={() => handleOpenProduct(product)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:border-primary-300 transition-colors">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-20 h-20 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500 font-bold text-xl uppercase">
                                            {product.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                                        {product.description && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>}
                                        <div className="mt-2 text-primary-600 font-bold">
                                            R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Carrinho Flutuante */}
            {cartCount > 0 && (
                <div onClick={() => setIsCartOpen(true)} className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center cursor-pointer hover:bg-primary-700 transition animate-in slide-in-from-bottom flex-shrink-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">{cartCount}</div>
                        <span className="font-medium">Ver carrinho</span>
                    </div>
                    <div className="font-bold">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            )}

            {/* Modal do Produto */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Imagem */}
                        {selectedProduct.imageUrl ? (
                            <div className="relative h-64 w-full bg-gray-100">
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur-md rounded-full text-gray-800 hover:bg-white transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative p-4 flex justify-end">
                                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto flex-1">
                            <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                            {selectedProduct.description && <p className="text-gray-500 mt-2 leading-relaxed">{selectedProduct.description}</p>}
                            <div className="mt-4 text-xl font-bold text-primary-600">
                                R$ {Number(selectedProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>

                            <div className="mt-8">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Alguma observação?</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Tirar cebola, maionese à parte..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none h-24"
                                />
                            </div>
                        </div>

                        {/* Footer (Actions) */}
                        <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-4">
                            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-2 border border-gray-200">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-400 hover:text-primary-600 transition"><Minus className="w-5 h-5" /></button>
                                <span className="font-bold text-gray-900 w-4 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-400 hover:text-primary-600 transition"><Plus className="w-5 h-5" /></button>
                            </div>
                            <button onClick={handleAddToCart} className="flex-1 bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex justify-between px-6 items-center">
                                <span>Adicionar</span>
                                <span>R$ {(Number(selectedProduct.price) * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal do Carrinho (Draft) */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary-500" />
                                Seu Pedido
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start py-4 border-b border-gray-50 last:border-0">
                                    {item.product.imageUrl ? (
                                        <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-lg uppercase">
                                            {item.product.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900">{item.quantity}x {item.product.name}</h4>
                                            <span className="font-bold text-gray-900 ml-2 whitespace-nowrap">R$ {(Number(item.product.price) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {item.notes && <p className="text-xs text-gray-500 mt-1 bg-yellow-50 text-yellow-800 p-1.5 rounded-lg border border-yellow-100 italic">"{item.notes}"</p>}

                                        <div className="flex items-center justify-between mt-3">
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-red-500 font-bold hover:underline">Remover</button>
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                                <button onClick={() => updateCartItem(item.product.id, item.quantity - 1)} className="p-1 text-gray-500 hover:text-primary-600 transition"><Minus className="w-3 h-3" /></button>
                                                <span className="font-bold text-sm text-gray-900 w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateCartItem(item.product.id, item.quantity + 1)} className="p-1 text-gray-500 hover:text-primary-600 transition"><Plus className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-600 font-medium">Total do Pedido</span>
                                <span className="text-3xl font-black text-gray-900">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"
                            >
                                Escolher Forma de Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Login e Finalização */}
            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

            {/* Modal de Perfil do Cliente */}
            {slug && (
                <CustomerProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    slug={slug}
                />
            )}
        </div>
    );
}
