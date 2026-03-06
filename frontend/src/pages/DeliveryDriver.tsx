import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../contexts/AuthContext';
import { MapPin, Navigation, CheckCircle2, Package, Loader2, Phone, AlertCircle, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
    id: string;
    quantity: number;
    notes?: string;
    product: {
        name: string;
    };
}

interface Order {
    id: string;
    status: 'READY' | 'DISPATCHED' | 'COMPLETED';
    orderType: 'DELIVERY';
    customerName: string | null;
    totalAmount: number | string;
    paymentMethod: string | null;
    changeFor: number | string | null;
    notes: string | null;
    deliveryAddress: string | null;
    createdAt: string;
    items: OrderItem[];
    customer?: {
        phone: string;
    };
}

export function DeliveryDriver() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'READY' | 'DISPATCHED'>('READY');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['delivery-orders'],
        queryFn: async () => {
            const res = await api.get('/orders');
            // Filtrar apenas pedidos Delivery que estão Prontos ou em Rota
            return res.data.filter((o: Order) =>
                o.orderType === 'DELIVERY' &&
                (o.status === 'READY' || o.status === 'DISPATCHED')
            ) as Order[];
        },
        refetchInterval: 10000, // Atualiza a cada 10s
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return api.patch(`/orders/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
        },
        onError: () => {
            alert('Erro ao atualizar status do pedido.');
        }
    });

    const readyOrders = orders.filter(o => o.status === 'READY');
    const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED');

    const displayedOrders = activeTab === 'READY' ? readyOrders : dispatchedOrders;

    const handleWhatsApp = (phone?: string) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    const handleMaps = (address?: string | null) => {
        if (!address) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-primary-600 text-white px-5 py-6 rounded-b-3xl shadow-md z-10 relative">
                <h1 className="text-2xl font-black flex items-center gap-3">
                    <Navigation className="w-6 h-6" />
                    Entregador
                </h1>
                <p className="opacity-90 mt-1 text-sm font-medium">Gerencie suas entregas e rotas</p>

                {/* Abas */}
                <div className="flex items-center gap-2 mt-6 bg-black/10 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('READY')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'READY' ? 'bg-white text-primary-600 shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        <Package className="w-4 h-4" />
                        Expedição
                        {readyOrders.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                {readyOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('DISPATCHED')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'DISPATCHED' ? 'bg-white text-primary-600 shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        <Navigation className="w-4 h-4" />
                        Comigo
                        {dispatchedOrders.length > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                {dispatchedOrders.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Listagem */}
            <div className="p-4 space-y-4 pt-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" />
                        <span className="font-bold">Buscando rotas...</span>
                    </div>
                ) : displayedOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            {activeTab === 'READY' ? <Package className="w-10 h-10 text-gray-400" /> : <CheckCircle2 className="w-10 h-10 text-gray-400" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {activeTab === 'READY' ? 'Nenhum pedido na expedição' : 'Nenhuma entrega pendente'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {activeTab === 'READY' ? 'Quando a cozinha finalizar, os pacotes aparecerão aqui.' : 'Que beleza! Todas as rotas finalizadas.'}
                        </p>
                    </div>
                ) : (
                    displayedOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                            {/* Decorative line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeTab === 'READY' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 border-b-2 border-primary-100 inline-block">
                                        #{order.id.slice(-4).toUpperCase()}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-600 mt-1 capitalize">
                                        {order.customerName || 'Cliente sem nome'}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-xs text-gray-400 font-medium">
                                        {format(new Date(order.createdAt), 'HH:mm')}
                                    </span>
                                    <span className="font-black text-emerald-600 mt-1">
                                        R$ {Number(order.totalAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="bg-gray-50 p-3 rounded-xl mb-4 text-sm text-gray-700 flex items-start gap-3 border border-gray-100">
                                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-gray-900 mb-0.5">Endereço de Entrega:</strong>
                                    {order.deliveryAddress ? (
                                        <span className="leading-tight block">{order.deliveryAddress}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">Endereço não informado. Pergunte ao balcão.</span>
                                    )}
                                </div>
                            </div>

                            {/* Detalhes do Pedido & Pagamento */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                <div className="bg-blue-50 text-blue-800 text-xs font-bold px-2 py-1 rounded-md border border-blue-100 capitalize">
                                    {order.paymentMethod || 'Não definido'}
                                </div>
                                {order.changeFor && (
                                    <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Levar troco p/ R$ {Number(order.changeFor).toFixed(2)}
                                    </div>
                                )}
                                <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" />
                                    {order.items.reduce((acc, it) => acc + it.quantity, 0)} itens
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {activeTab === 'READY' ? (
                                    <>
                                        <button
                                            onClick={() => handleMaps(order.deliveryAddress)}
                                            className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-200 transition"
                                        >
                                            <MapPin className="w-5 h-5 text-gray-500" />
                                            <span className="text-xs">Ver Mapa</span>
                                        </button>
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'DISPATCHED' })}
                                            disabled={updateStatusMutation.isPending}
                                            className="py-3 bg-blue-600 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95"
                                        >
                                            <Navigation className="w-5 h-5" />
                                            <span className="text-xs">Peguei o Pacote</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 col-span-1">
                                            <button
                                                onClick={() => handleMaps(order.deliveryAddress)}
                                                className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-200 transition"
                                            >
                                                <MapPin className="w-5 h-5" />
                                                <span className="text-[10px]">Mapa</span>
                                            </button>
                                            <button
                                                onClick={() => handleWhatsApp(order.customer?.phone)}
                                                className="py-3 bg-green-50 text-green-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-green-100 transition border border-green-200"
                                            >
                                                <Phone className="w-5 h-5" />
                                                <span className="text-[10px]">Ligar</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'COMPLETED' })}
                                            disabled={updateStatusMutation.isPending}
                                            className="py-3 bg-emerald-500 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="text-xs">Finalizar Entrega</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
