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
    orderType?: 'DELIVERY' | 'PICKUP' | 'TABLE' | null;
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

function OrderTicket({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, s: string) => void }) {
    const { timeStr, isLate } = useOrderTimer(order.createdAt);
    const isPreparing = order.status === 'PREPARING';

    return (
        <div className={`flex-none w-[340px] flex flex-col max-h-[calc(100vh-140px)] rounded-2xl shadow-sm hover:shadow-md transition-all flex-shrink-0 snap-start relative overflow-hidden bg-white border ${isPreparing ? 'border-blue-300 shadow-blue-500/10' : 'border-gray-200'}`}>

            {/* Tag Lateral "Novo" ou "Em Preparo" */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isPreparing ? 'bg-blue-500' : 'bg-primary-500'}`}></div>

            {/* Cabeçalho do Recibo */}
            <div className={`pl-5 pr-4 py-4 flex justify-between items-start border-b border-gray-100 ${isLate ? 'bg-red-50' : isPreparing ? 'bg-blue-50/30' : 'bg-gray-50/50'}`}>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">
                        #{order.id.slice(-4).toUpperCase()}
                    </h3>
                    <p className="text-sm font-bold text-gray-500 truncate max-w-[160px]">
                        {order.customerName || 'Balcão'}
                    </p>
                    <div className="mt-1 flex gap-1">
                        {order.orderType === 'DELIVERY' && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">Delivery</span>
                        )}
                        {order.orderType === 'PICKUP' && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">Balcão</span>
                        )}
                    </div>
                </div>

                {/* Timer Real-Time Grande */}
                <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg border bg-white ${isLate ? 'border-red-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${isLate ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                        <span className={`font-mono text-xl font-bold tracking-tight ${isLate ? 'text-red-600' : 'text-gray-700'}`}>
                            {timeStr}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lista de Itens (Scrollável) */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-white custom-scrollbar border-b border-gray-100">
                {order.items.map(item => (
                    <div key={item.id} className="flex gap-4 items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm ${isPreparing ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                            {item.quantity}
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-lg font-bold text-gray-800 leading-tight">
                                {item.product?.name || 'Item Excluído'}
                            </h4>
                            {item.notes && (
                                <div className="mt-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg font-medium flex gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600" />
                                    <span>{item.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ações (Touch Buttons Gigantes) */}
            <div className="p-4 bg-gray-50 mt-auto">
                {order.status === 'QUEUE' ? (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <PlayCircle className="w-6 h-6" /> Iniciar Preparo
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            // Se for Delivery manda para expedição. Balcão vai para concluído direto.
                            const nextStatus = order.orderType === 'DELIVERY' ? 'READY' : 'COMPLETED';
                            onUpdateStatus(order.id, nextStatus);
                        }}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                        <span className="font-bold flex-1 text-left line-clamp-2 leading-tight">
                            {order.orderType === 'DELIVERY' ? 'Pronto (Expedição / Motoboy)' : 'Entregar (Balcão/Mesa)'}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}

export function Kitchen() {
    const queryClient = useQueryClient();
    const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
        return localStorage.getItem('kds-audio-enabled') === 'true';
    });
    const knownOrderIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    // Pre-unlocked Audio element ref — created on user gesture, reused on polling
    const beepAudioRef = useRef<HTMLAudioElement | null>(null);

    // Request browser notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Initialize audio element on mount if previously enabled
    useEffect(() => {
        if (isAudioEnabled && !beepAudioRef.current) {
            const audio = new Audio('/kitchen-beep.wav');
            audio.volume = 1;
            audio.load(); // Pre-load the file
            beepAudioRef.current = audio;
        }
    }, []);

    const playNotificationSound = (latestOrder?: Order) => {
        // 1. Audio element beep
        if (!isAudioEnabled) return;

        // Try playing the unlocked ref
        if (beepAudioRef.current) {
            beepAudioRef.current.currentTime = 0;
            beepAudioRef.current.play().catch(() => {
                // If it fails (maybe the user reloaded and gesture got lost), try creating a fresh one
                try {
                    const fallback = new Audio('/kitchen-beep.wav');
                    fallback.volume = 1;
                    fallback.play().catch(() => { /* truly blocked */ });
                } catch (e) { /* ok */ }
            });
        } else {
            // Fallback if ref isn't set
            try {
                const audio = new Audio('/kitchen-beep.wav');
                audio.volume = 1;
                audio.play().catch(() => { /* blocked */ });
            } catch (e) { /* ok */ }
        }

        // 2. Speech synthesis (works independently of Audio element)
        setTimeout(() => {
            try {
                let textToSay = 'Novo pedido na cozinha!';
                if (latestOrder) {
                    const itemsStr = latestOrder.items.map(i => `${i.quantity} ${i.product?.name || 'item'}`).join(', ');
                    const customer = latestOrder.customerName ? `Para ${latestOrder.customerName}. ` : '';
                    textToSay = `Novo pedido de número ${latestOrder.id.slice(-3)}. ${customer} Itens: ${itemsStr}.`;
                }

                const msg = new SpeechSynthesisUtterance(textToSay);
                msg.lang = 'pt-BR';
                msg.rate = 1.0; // Slower, more natural rate
                msg.volume = 1;
                window.speechSynthesis.speak(msg);
            } catch (e) { /* speech not available */ }
        }, 900);
    };

    // Show browser notification (with system sound)
    const showBrowserNotification = (newOrderCount: number) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification('🛎️ Novo Pedido na Cozinha!', {
                    body: `${newOrderCount} novo(s) pedido(s) chegaram. Toque para ver.`,
                    icon: '/pwa-icon.svg',
                    tag: 'kitchen-new-order', // Prevents multiple notifications stacking
                    requireInteraction: true,
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Auto-close after 10 seconds
                setTimeout(() => notification.close(), 10000);
            } catch (e) {
                // Fallback: Service Worker notification
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification('🛎️ Novo Pedido na Cozinha!', {
                            body: `${newOrderCount} novo(s) pedido(s) chegaram.`,
                            icon: '/pwa-icon.svg',
                            tag: 'kitchen-new-order',
                        });
                    });
                }
            }
        }
    };

    // React Query puxando os pedidos ativos (polling a cada 5 segundos)
    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['kitchen-orders'],
        queryFn: async () => {
            const res = await api.get('/orders');
            let activeOrders = res.data.filter((o: Order) => o.status === 'QUEUE' || o.status === 'PREPARING');

            // Ordenar por data de criação (mais antigos primeiro)
            activeOrders.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            // Skip notification on first load (avoid alert storm on page open)
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
            } else if (knownOrderIds.current.size > 0 || activeOrders.length > 0) {
                const newOrders = activeOrders.filter((o: Order) => !knownOrderIds.current.has(o.id));
                if (newOrders.length > 0) {
                    const latestOrder = newOrders[newOrders.length - 1]; // Get the most recent one for dictation
                    // Play sound + show browser notification
                    playNotificationSound(latestOrder);
                    showBrowserNotification(newOrders.length);
                }
            }

            // Atualiza nossa memória de "pedidos conhecidos"
            const newKnownIds = new Set<string>();
            activeOrders.forEach((o: Order) => newKnownIds.add(o.id));
            knownOrderIds.current = newKnownIds;

            return activeOrders as Order[];
        },
        refetchInterval: 5000, // Polling a cada 5 segundos para detecção rápida
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
        <div className="flex flex-col h-full bg-gray-100 p-4 md:p-6 pb-24 md:pb-6 relative overflow-hidden font-sans">
            {/* Header Light Mode */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-primary-500" />
                        KDS <span className="text-gray-400 text-xl md:text-2xl font-medium ml-2 border-l border-gray-300 pl-4 hidden md:inline">Monitor da Cozinha</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={() => {
                            if (!isAudioEnabled) {
                                // Request notification permission
                                if ('Notification' in window && Notification.permission === 'default') {
                                    Notification.requestPermission();
                                }

                                // CRITICAL: Create and play Audio on USER GESTURE to unlock it
                                // Mobile browsers only allow Audio.play() from direct user interaction
                                const audio = new Audio('/kitchen-beep.wav');
                                audio.volume = 1;
                                audio.play().then(() => {
                                    // Audio is now "unlocked" — store in ref for future use
                                    beepAudioRef.current = audio;
                                }).catch(() => {
                                    // Even if play fails, store it — some browsers unlock on next play
                                    beepAudioRef.current = audio;
                                });

                                // Unlock SpeechSynthesis too
                                try {
                                    const msg = new SpeechSynthesisUtterance('Sons ativados');
                                    msg.lang = 'pt-BR';
                                    msg.volume = 0.5;
                                    window.speechSynthesis.speak(msg);
                                } catch (e) { /* ok */ }

                                setIsAudioEnabled(true);
                                localStorage.setItem('kds-audio-enabled', 'true');
                            } else {
                                setIsAudioEnabled(false);
                                localStorage.setItem('kds-audio-enabled', 'false');
                                beepAudioRef.current = null;
                            }
                        }}
                        className={`flex items-center justify-center p-3 rounded-2xl transition-all shadow-sm ${isAudioEnabled
                            ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                        title={isAudioEnabled ? 'Sons Ligados' : 'Ligar Sons (Recomendado)'}
                    >
                        {isAudioEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>

                    <div className="bg-white px-4 md:px-5 py-2.5 md:py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 md:gap-3">
                        <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-primary-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(var(--color-primary-500),0.5)]"></div>
                        <span className="font-black text-gray-900 text-base md:text-lg">{orders.length}</span>
                        <span className="text-gray-500 font-medium text-sm md:text-base hidden sm:inline">pedidos ativos</span>
                    </div>
                </div>
            </div>

            {!isAudioEnabled && orders.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 md:py-4 rounded-xl flex items-center shadow-sm">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0 mr-3 text-amber-500" />
                    <span className="text-sm md:text-base font-medium">Toque no ícone de som acima para habilitar o ALARME SONORO de novos pedidos.</span>
                </div>
            )}

            {/* Kanban KDS Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4 md:-mx-6 md:px-6 custom-scrollbar">
                {loading && orders.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4 mt-10">
                        <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin text-primary-500" />
                        <span className="font-bold text-lg md:text-xl tracking-tight text-gray-500">Sincronizando Cozinha...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center mt-10">
                        <ChefHat className="w-24 h-24 md:w-32 md:h-32 mb-6 text-gray-200" />
                        <h2 className="text-2xl md:text-3xl font-black text-gray-400 mb-2 tracking-tight">Cozinha Limpa!</h2>
                        <p className="text-gray-400 font-medium text-base md:text-lg">Nenhum pedido na fila de produção.</p>
                    </div>
                ) : (
                    <div className="flex gap-4 md:gap-6 h-full pb-4 items-start snap-x">

                        {/* Renderizar primeiro os EM PREPARO (foco maior) e depois os NA FILA */}
                        {prepOrders.map(order => (
                            <OrderTicket key={`prep-${order.id}`} order={order} onUpdateStatus={handleUpdateStatus} />
                        ))}

                        {/* Separador Visual se houverem os dois tipos */}
                        {prepOrders.length > 0 && queueOrders.length > 0 && (
                            <div className="w-px h-[80%] bg-gray-300 my-auto rounded-full mx-1 md:mx-2 flex-shrink-0"></div>
                        )}

                        {queueOrders.map(order => (
                            <OrderTicket key={`queue-${order.id}`} order={order} onUpdateStatus={handleUpdateStatus} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(243, 244, 246, 0.5); /* gray-100 */
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(209, 213, 219, 1); /* gray-300 */
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 1); /* gray-400 */
                }
            `}</style>
        </div>
    );
}
