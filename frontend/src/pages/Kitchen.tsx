import { useState, useEffect, useRef } from 'react';
import { api } from '../contexts/AuthContext';
import { ChefHat, Loader2, PlayCircle, CheckCircle2, Clock, AlertCircle, Volume2, VolumeX } from 'lucide-react';
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
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const knownOrderIds = useRef<Set<string>>(new Set());

    const playNotificationSound = () => {
        if (!isAudioEnabled) return;

        try {
            // 1. Play a Beep/Bell sound using AudioContext
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.frequency.setValueAtTime(800, ctx.currentTime); // High pitch BEEP
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);

            // 2. Speak using SpeechSynthesis
            setTimeout(() => {
                const msg = new SpeechSynthesisUtterance('Novo pedido na cozinha!');
                msg.lang = 'pt-BR';
                msg.rate = 1.1; // Slightly faster
                window.speechSynthesis.speak(msg);
            }, 600); // Wait for the beep to finish

        } catch (e) {
            console.error('Erro ao reproduzir áudio:', e);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            const activeOrders = res.data.filter((o: Order) => o.status === 'QUEUE' || o.status === 'PREPARING');

            activeOrders.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            // Check for NEW orders to trigger sound
            if (knownOrderIds.current.size > 0 && activeOrders.length > 0) {
                const hasNewOrders = activeOrders.some((o: Order) => !knownOrderIds.current.has(o.id));
                if (hasNewOrders) {
                    playNotificationSound();
                }
            }

            // Update known orders tracking memory
            const newKnownIds = new Set<string>();
            activeOrders.forEach((o: Order) => newKnownIds.add(o.id));
            knownOrderIds.current = newKnownIds;

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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsAudioEnabled(!isAudioEnabled);
                            if (!isAudioEnabled) {
                                // Request permission/initial interaction to unlock Audio API
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                ctx.resume();
                            }
                        }}
                        className={`flex items-center justify-center p-2 rounded-xl transition-colors shadow-sm border ${isAudioEnabled
                                ? 'bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                            }`}
                        title={isAudioEnabled ? 'Notificações Sonoras Ligadas' : 'Ligar Notificações Sonoras'}
                    >
                        {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>

                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold text-gray-700">{orders.length} pedidos</span>
                    </div>
                </div>
            </div>

            {!isAudioEnabled && orders.length > 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">Ligue as notificações sonoras (botão de volume acima) para ouvir quando um novo pedido chegar.</span>
                    </div>
                </div>
            )}

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
