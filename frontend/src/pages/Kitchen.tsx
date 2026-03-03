import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../contexts/AuthContext';
import { ChefHat, Loader2, PlayCircle, CheckCircle2, Clock, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';

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

// Helper para transformar Date em string tipo "04:12"
const useOrderTimer = (createdAt: string) => {
    const [timeStr, setTimeStr] = useState('00:00');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const date = new Date(createdAt);
            const now = new Date();
            const mins = differenceInMinutes(now, date);
            const secs = differenceInSeconds(now, date) % 60;

            // Format to MM:SS
            const m = String(mins).padStart(2, '0');
            const s = String(secs).padStart(2, '0');
            setTimeStr(`${m}:${s}`);

            // Se passou de 15 minutos, consideramos "Atrasado"
            setIsLate(mins >= 15);
        };

        calculate();
        const interval = setInterval(calculate, 1000); // Atualiza a cada segundo
        return () => clearInterval(interval);
    }, [createdAt]);

    return { timeStr, isLate };
};

// Componente Isolado de Ticket (Comanda Digital)
function OrderTicket({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, s: string) => void }) {
    const { timeStr, isLate } = useOrderTimer(order.createdAt);
    const isPreparing = order.status === 'PREPARING';

    return (
        <div className={`flex-none w-[340px] flex flex-col max-h-[calc(100vh-140px)] rounded-xl shadow-2xl transition-all flex-shrink-0 snap-start relative overflow-hidden bg-slate-800 border-2 ${isPreparing ? 'border-blue-500 shadow-blue-500/20' : 'border-slate-700'}`}>

            {/* Tag Lateral "Novo" ou "Em Preparo" */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isPreparing ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

            {/* Cabeçalho do Recibo */}
            <div className={`pl-5 pr-4 py-4 flex justify-between items-start border-b border-slate-700/50 ${isLate ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
                <div>
                    <h3 className="text-2xl font-black text-white leading-none mb-1">
                        #{order.id.slice(-4).toUpperCase()}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 truncate max-w-[160px]">
                        {order.customerName || 'Balcão'}
                    </p>
                </div>

                {/* Timer Real-Time Grande */}
                <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg border ${isLate ? 'bg-red-500/20 border-red-500/30' : 'bg-slate-900 border-slate-700'}`}>
                    <div className="flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${isLate ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`font-mono text-xl font-bold tracking-tight ${isLate ? 'text-red-400' : 'text-slate-300'}`}>
                            {timeStr}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lista de Itens (Scrollável) - Fundo escuro imitando papel térmico escuro */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-900/50 custom-scrollbar">
                {order.items.map(item => (
                    <div key={item.id} className="flex gap-4 items-start">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner ${isPreparing ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                            {item.quantity}
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-lg font-bold text-white leading-tight">
                                {item.product?.name || 'Item Excluído'}
                            </h4>
                            {item.notes && (
                                <div className="mt-2 text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg font-medium flex gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{item.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ações (Touch Buttons Gigantes) */}
            <div className="p-4 bg-slate-800 border-t border-slate-700 mt-auto">
                {order.status === 'QUEUE' ? (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xl uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                        <PlayCircle className="w-7 h-7" /> Iniciar Preparo
                    </button>
                ) : (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xl uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                        <CheckCircle2 className="w-7 h-7" /> Pronto (Saída)
                    </button>
                )}
            </div>
        </div>
    );
}

export function Kitchen() {
    const queryClient = useQueryClient();
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const knownOrderIds = useRef<Set<string>>(new Set());

    // Som de Notificação
    const playNotificationSound = () => {
        if (!isAudioEnabled) return;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);

            setTimeout(() => {
                const msg = new SpeechSynthesisUtterance('Novo pedido na cozinha!');
                msg.lang = 'pt-BR';
                msg.rate = 1.1;
                window.speechSynthesis.speak(msg);
            }, 600);

        } catch (e) {
            console.error('Erro ao reproduzir áudio:', e);
        }
    };

    // React Query puxando os pedidos ativos
    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['kitchen-orders'],
        queryFn: async () => {
            const res = await api.get('/orders');
            let activeOrders = res.data.filter((o: Order) => o.status === 'QUEUE' || o.status === 'PREPARING');

            // Ordenar por data de criação (mais antigos primeiro)
            activeOrders.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            // Avaliar se há um pedido novo para tocar BEEP
            if (knownOrderIds.current.size > 0 && activeOrders.length > 0) {
                const hasNewOrders = activeOrders.some((o: Order) => !knownOrderIds.current.has(o.id));
                if (hasNewOrders) {
                    playNotificationSound();
                }
            }

            // Atualiza nossa memória de "pedidos conhecidos"
            const newKnownIds = new Set<string>();
            activeOrders.forEach((o: Order) => newKnownIds.add(o.id));
            knownOrderIds.current = newKnownIds;

            return activeOrders as Order[];
        },
        refetchInterval: 15000, // Substitui o setInterval (Polling automágico)
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return api.patch(`/orders/${id}/status`, { status });
        },
        onMutate: async ({ id, status }) => {
            // Optimistic Update: Faz a tela reagir instantaneamente antes do backend responder
            await queryClient.cancelQueries({ queryKey: ['kitchen-orders'] });
            const previousOrders = queryClient.getQueryData<Order[]>(['kitchen-orders']);

            if (previousOrders) {
                if (status === 'COMPLETED') {
                    queryClient.setQueryData(['kitchen-orders'], previousOrders.filter(o => o.id !== id));
                } else {
                    queryClient.setQueryData(['kitchen-orders'], previousOrders.map(o => o.id === id ? { ...o, status } : o));
                }
            }
            return { previousOrders };
        },
        onError: (_err, _variables, context: any) => {
            // Se der erro, reverte a tela pra como era
            if (context?.previousOrders) {
                queryClient.setQueryData(['kitchen-orders'], context.previousOrders);
            }
            alert('Erro ao atualizar comanda.');
        },
        onSettled: () => {
            // Independente de dar certo ou errado, sincroniza pra garantir a verdade do BD
            queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
        }
    });

    const handleUpdateStatus = (orderId: string, newStatus: string) => {
        updateStatusMutation.mutate({ id: orderId, status: newStatus });
    };

    const queueOrders = orders.filter(o => o.status === 'QUEUE');
    const prepOrders = orders.filter(o => o.status === 'PREPARING');

    return (
        <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 pb-24 md:pb-6 relative overflow-hidden font-sans">
            {/* Header Dark Mode */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <ChefHat className="w-10 h-10 text-emerald-500" />
                        KDS <span className="text-slate-500 text-xl md:text-2xl font-medium ml-2">Monitor da Cozinha</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsAudioEnabled(!isAudioEnabled);
                            if (!isAudioEnabled) {
                                // Request permission/initial interaction to unlock Audio API
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                ctx.resume();
                            }
                        }}
                        className={`flex items-center justify-center p-3 rounded-2xl transition-all shadow-lg ${isAudioEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                            }`}
                        title={isAudioEnabled ? 'Sons Ligados' : 'Ligar Sons (Recomendado)'}
                    >
                        {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>

                    <div className="bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 shadow-inner flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="font-bold text-white text-lg">{orders.length}</span>
                        <span className="text-slate-400 font-medium">pedidos ativos</span>
                    </div>
                </div>
            </div>

            {!isAudioEnabled && orders.length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-4 rounded-xl flex items-center shadow-lg shadow-amber-500/5">
                    <AlertCircle className="w-6 h-6 shrink-0 mr-3 text-amber-500" />
                    <span className="text-sm md:text-base font-medium">Toque no alto-falante acima para habilitar o ALARME SONORO de novos pedidos.</span>
                </div>
            )}

            {/* Kanban KDS Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4 md:-mx-6 md:px-6 custom-scrollbar">
                {loading && orders.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 mt-10">
                        <Loader2 className="w-16 h-16 animate-spin text-slate-600" />
                        <span className="font-bold text-xl tracking-tight">Sincronizando Cozinha...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center mt-10">
                        <ChefHat className="w-32 h-32 mb-6 text-slate-800" />
                        <h2 className="text-3xl font-black text-slate-400 mb-2 tracking-tight">Cozinha Limpa!</h2>
                        <p className="text-slate-500 font-medium text-lg">Nenhum pedido na fila de produção.</p>
                    </div>
                ) : (
                    <div className="flex gap-6 h-full pb-4 items-start snap-x">

                        {/* Renderizar primeiro os EM PREPARO (foco maior) e depois os NA FILA */}
                        {prepOrders.map(order => (
                            <OrderTicket key={`prep-${order.id}`} order={order} onUpdateStatus={handleUpdateStatus} />
                        ))}

                        {/* Separador Visual se houverem os dois tipos */}
                        {prepOrders.length > 0 && queueOrders.length > 0 && (
                            <div className="w-px h-[80%] bg-slate-800 my-auto rounded-full mx-2 flex-shrink-0"></div>
                        )}

                        {queueOrders.map(order => (
                            <OrderTicket key={`queue-${order.id}`} order={order} onUpdateStatus={handleUpdateStatus} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 12px;
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5); /* slate-900 border */
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(51, 65, 85, 0.8); /* slate-700 */
                    border-radius: 8px;
                    border: 2px solid rgba(15, 23, 42, 1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(71, 85, 105, 1); /* slate-600 */
                }
            `}</style>
        </div>
    );
}
