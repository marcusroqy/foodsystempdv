import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { FileText, Loader2, ShoppingBag, Calendar, User, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
    id: string;
    product: {
        id: string;
        name: string;
    };
    quantity: number;
    unitPrice: string | number;
    notes?: string;
}

interface Order {
    id: string;
    customerName: string | null;
    status: 'QUEUE' | 'PREPARING' | 'COMPLETED' | 'CANCELED';
    totalAmount: string | number;
    createdAt: string;
    items: OrderItem[];
}

const statusColors = {
    QUEUE: 'bg-yellow-100 text-yellow-800',
    PREPARING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELED: 'bg-red-100 text-red-800'
};

const statusLabels = {
    QUEUE: 'Na Fila',
    PREPARING: 'Preparando',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado'
};

export function OrdersHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        } catch (error) {
            alert('Erro ao atualizar status do pedido.');
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!window.confirm('Tem certeza que deseja apagar este pedido? Esta ação não pode ser desfeita.')) return;

        try {
            await api.delete(`/orders/${orderId}`);
            setOrders(orders.filter(o => o.id !== orderId));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
        } catch (error) {
            alert('Erro ao excluir pedido.');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 md:p-6 pb-24 md:pb-6 relative max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary-500" />
                        Histórico de Vendas
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Veja todos os recibos e comandos fechados</p>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-semibold rounded-tl-xl">Pedido / Data</th>
                                <th className="p-4 font-semibold hidden sm:table-cell">Cliente</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Total</th>
                                <th className="p-4 font-semibold text-center rounded-tr-xl">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-primary-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="font-medium">Carregando histórico...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
                                            <span className="font-medium">Nenhuma venda encontrada</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 lg:p-5">
                                            <div className="flex items-start md:items-center gap-3 flex-col md:flex-row">
                                                <div className="bg-primary-50 p-2 rounded-lg text-primary-600 font-bold text-sm hidden md:block">
                                                    #{order.id.slice(-4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-800 md:hidden block mb-1">
                                                        #{order.id.slice(-4).toUpperCase()}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 lg:p-5 hidden sm:table-cell align-middle">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium truncate max-w-[150px]">{order.customerName || 'Cliente Balcão'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 lg:p-5 align-middle">
                                            <div className="relative inline-block">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className={`appearance-none bg-transparent pl-3 pr-8 py-1.5 rounded-full text-xs font-bold outline-none cursor-pointer border-2 transition-colors ${order.status === 'QUEUE' ? 'border-yellow-200 text-yellow-800 bg-yellow-50 hover:bg-yellow-100' :
                                                            order.status === 'PREPARING' ? 'border-blue-200 text-blue-800 bg-blue-50 hover:bg-blue-100' :
                                                                order.status === 'COMPLETED' ? 'border-green-200 text-green-800 bg-green-50 hover:bg-green-100' :
                                                                    'border-red-200 text-red-800 bg-red-50 hover:bg-red-100'
                                                        }`}
                                                >
                                                    <option value="QUEUE">Na Fila</option>
                                                    <option value="PREPARING">Preparando</option>
                                                    <option value="COMPLETED">Concluído</option>
                                                    <option value="CANCELED">Cancelado</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <svg className="h-3 w-3 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 lg:p-5 text-right font-bold text-gray-900 align-middle whitespace-nowrap">
                                            R$ {Number(order.totalAmount).toFixed(2)}
                                        </td>
                                        <td className="p-4 lg:p-5 text-center align-middle">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="inline-flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Excluir Pedido"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes do Pedido */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Recibo <span className="text-primary-500">#{selectedOrder.id.slice(-4).toUpperCase()}</span></h2>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Corpo Modal (Scrollable) */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 mb-1">Cliente</span>
                                        <span className="font-semibold text-gray-800">{selectedOrder.customerName || 'Cliente Balcão'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 mb-1">Status</span>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${statusColors[selectedOrder.status]}`}>
                                            {statusLabels[selectedOrder.status]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Itens Consumidos</h3>

                            <div className="space-y-3">
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-50">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-800 block text-sm">
                                                <span className="text-gray-400 mr-2">{item.quantity}x</span>
                                                {item.product?.name || 'Produto Excluído'}
                                            </span>
                                            {item.notes && (
                                                <span className="text-xs text-orange-500 italic block mt-1 line-clamp-2">OBS: {item.notes}</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-gray-700 text-sm whitespace-nowrap">
                                            R$ {Number(item.unitPrice).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Totais */}
                        <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-between items-center flex-shrink-0">
                            <span className="text-gray-300 font-medium">Total Pago</span>
                            <span className="text-2xl font-bold text-white">R$ {Number(selectedOrder.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
