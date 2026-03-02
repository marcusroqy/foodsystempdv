import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { ChefHat, Loader2, PlayCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
    id: string;
    product: {
        id: string;
        name: string;
    };
    quantity: number;
    notes?: string;
}

interface Order {
    id: string;
    customerName: string | null;
    status: 'QUEUE' | 'PREPARING' | 'COMPLETED' | 'CANCELED';
    createdAt: string;
    items: OrderItem[];
}

export function Kitchen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            // We only want active orders for the kitchen
            const res = await api.get('/orders');
            const activeOrders = res.data.filter((o: Order) => o.status === 'QUEUE' || o.status === 'PREPARING');

            // Sort by createdAt ascending (oldest first)
            activeOrders.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            setOrders(activeOrders);
        } catch (error) {
            console.error('Erro ao buscar pedidos da cozinha:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh (Polling) every 15 seconds
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => {
            fetchOrders();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            // Optmistic update to remove it/change its color immediately instead of waiting for next poll
            if (newStatus === 'COMPLETED') {
                setOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            }
        } catch (error) {
            alert('Erro ao atualizar comanda.');
        }
    };

    const formatWaitTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { locale: ptBR });
        } catch {
            return '...';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4 md:p-6 pb-24 md:pb-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-primary-500" />
                        Comandas (Cozinha)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Atualização automática a cada 15s</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-bold text-gray-700">{orders.length} pedidos na fila</span>
                </div>
            </div>

            {/* Comandas Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4 md:-mx-6 md:px-6">
                <div className="flex gap-4 md:gap-6 h-full pb-4 items-start snap-x">

                    {loading && orders.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center text-primary-500 gap-3 mt-20">
                            <Loader2 className="w-12 h-12 animate-spin" />
                            <span className="font-medium text-lg">Procurando comandas...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center text-gray-400 mt-20">
                            <ChefHat className="w-24 h-24 mb-4 opacity-30" />
                            <h2 className="text-2xl font-bold text-gray-500 mb-2">Nenhum pedido na fila</h2>
                            <p className="text-gray-400 mb-6">A cozinha está limpa no momento!</p>
                            <button onClick={fetchOrders} className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                                Atualizar Agora
                            </button>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div
                                key={order.id}
                                className={`flex-none w-80 md:w-96 flex flex-col max-h-[calc(100vh-160px)] rounded-2xl shadow-md border-2 transition-all flex-shrink-0 snap-start
                                    ${order.status === 'PREPARING'
                                        ? 'bg-blue-50/50 border-blue-400 shadow-blue-500/10'
                                        : 'bg-white border-yellow-400 shadow-yellow-500/10'
                                    }`}
                            >
                                {/* Comanda Header */}
                                <div className={`p-4 border-b-2 flex justify-between items-start 
                                    ${order.status === 'PREPARING' ? 'bg-blue-100 border-blue-200' : 'bg-yellow-100 border-yellow-200'}
                                    rounded-t-[14px]`}>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 leading-none mb-1">
                                            #{order.id.slice(-4).toUpperCase()}
                                        </h3>
                                        <p className="text-sm font-bold text-gray-700 truncate max-w-[180px]">
                                            {order.customerName || 'Balcão'}
                                        </p>
                                    </div>
                                    <div className={`flex flex-col items-end`}>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider
                                            ${order.status === 'PREPARING' ? 'bg-blue-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                                            {order.status === 'PREPARING' ? 'Preparando' : 'Aguardando'}
                                        </span>
                                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatWaitTime(order.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Items List (Scrollable) */}
                                <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-white/50">
                                    {order.items.map(item => (
                                        <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex gap-3 items-start">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg shrink-0
                                                    ${order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {item.quantity}
                                                </div>
                                                <div className="flex-1 pt-0.5">
                                                    <h4 className="font-bold text-gray-900 leading-tight">
                                                        {item.product?.name || 'Excluído'}
                                                    </h4>
                                                    {item.notes && (
                                                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg font-medium flex gap-2">
                                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <span>{item.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions Footer */}
                                <div className="p-4 bg-white/80 rounded-b-2xl border-t border-gray-100 mt-auto">
                                    {order.status === 'QUEUE' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <PlayCircle className="w-6 h-6" /> INICIAR PREPARO
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-green-500/30 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-6 h-6" /> PRONTO!
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
