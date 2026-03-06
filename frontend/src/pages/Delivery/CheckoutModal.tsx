import { useState } from 'react';
import { useDelivery } from '../../contexts/DeliveryContext';
import { api } from '../../contexts/AuthContext';
import { X, UserRound, ArrowRight, Loader2, MapPin } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { tenant, cart, cartTotal, customer, login, logout, clearCart } = useDelivery();
    if (!isOpen) return null;

    // View States: 'AUTH_PHONE' | 'AUTH_REGISTER' | 'AUTH_LOGIN' | 'CHECKOUT'
    const [view, setView] = useState<'AUTH_PHONE' | 'AUTH_REGISTER' | 'AUTH_LOGIN' | 'CHECKOUT'>(
        customer ? 'CHECKOUT' : 'AUTH_PHONE'
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auth Form State
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    // Checkout State
    const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH'>('PIX');
    const [changeFor, setChangeFor] = useState('');

    // --- Authentication Flow ---
    const checkPhone = () => {
        if (phone.length < 10) {
            setError('Digite um celular válido com DDD');
            return;
        }
        setError('');
        // Para simplificar no fluxo do cliente, assumimos que se ele não tem senha, ele cai no registro.
        // Como não temos um endpoint para "checar se o telefone existe", vamos direto para o Login
        // ou deixar ele escolher "Não tenho conta".
        setView('AUTH_LOGIN');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post(`/delivery/${tenant.slug}/auth/login`, { phone, password });
            login(res.data.token, res.data.customer);
            setView('CHECKOUT');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login. Verifique sua senha.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post(`/delivery/${tenant.slug}/auth/register`, {
                name, phone, password, street, number, neighborhood
            });
            login(res.data.token, res.data.customer);
            setView('CHECKOUT');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao criar conta.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Checkout Flow ---
    const handlePlaceOrder = async () => {
        if (!customer) return;
        if (orderType === 'DELIVERY' && (!customer.street || !customer.number || !customer.neighborhood)) {
            setError('Por favor, preencha seu endereço de entrega no perfil.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const items = cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                notes: item.notes
            }));

            const payload = {
                items,
                orderType,
                paymentMethod,
                changeFor: paymentMethod === 'CASH' && changeFor ? Number(changeFor) : null,
                notes: '',
                deliveryAddress: orderType === 'DELIVERY' ? `${customer.street}, ${customer.number} - ${customer.neighborhood}` : null
            };

            const token = localStorage.getItem('@FoodSystem:CustomerToken');
            await api.post(`/delivery/${tenant.slug}/orders`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Pedido feito com sucesso
            alert('🎉 Pedido realizado com sucesso!');
            clearCart();
            window.location.reload(); // Quick reset for now
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao processar pedido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {view === 'CHECKOUT' ? <MapPin className="w-5 h-5 text-primary-500" /> : <UserRound className="w-5 h-5 text-primary-500" />}
                        {view === 'CHECKOUT' ? 'Finalizar Pedido' : 'Identificação'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">{error}</div>}

                    {/* Step 1: Inserir Telefone */}
                    {view === 'AUTH_PHONE' && (
                        <div className="space-y-4">
                            <p className="text-gray-600">Para continuar e finalizar seu pedido, precisamos te identificar.</p>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Qual o seu celular (WhatsApp)?</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="(11) 90000-0000"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold tracking-wide"
                                />
                            </div>
                            <button
                                onClick={checkPhone}
                                className="w-full bg-primary-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition"
                            >
                                Continuar <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Login com Senha */}
                    {view === 'AUTH_LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <p className="text-gray-600">Bem vindo de volta! Digite sua senha ou crie uma conta.</p>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Sua Senha</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••"
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setView('AUTH_REGISTER')}
                                    className="flex-1 text-primary-600 p-4 rounded-xl font-bold bg-primary-50 border border-primary-100 hover:bg-primary-100 transition"
                                >
                                    Criar Conta
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-primary-600 text-white p-4 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50 flex justify-center"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Registro Completo */}
                    {view === 'AUTH_REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Como devemos te chamar?</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Crie uma senha</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>

                            <hr className="my-6 border-gray-100" />
                            <h3 className="font-bold text-gray-900 mb-2">Qual seu endereço de entrega padrão?</h3>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Rua/Avenida</label>
                                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua das Flores" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Número</label>
                                    <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Bairro</label>
                                    <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Centro" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-4 bg-primary-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Criar Conta e Continuar'}
                            </button>
                        </form>
                    )}

                    {/* Step 4: Checkout Area (Endereço, Tipo, Pagamento) */}
                    {view === 'CHECKOUT' && customer && (
                        <div className="space-y-6">
                            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-primary-600 font-bold uppercase tracking-wider">Logado como</p>
                                    <p className="font-black text-gray-900">{customer.name.split(' ')[0]}</p>
                                </div>
                                <button onClick={() => { logout(); setView('AUTH_PHONE'); }} className="text-xs font-bold text-primary-700 hover:text-primary-800 underline">Trocar conta</button>
                            </div>

                            {/* Detalhes de Retirada/Entrega (Será expandido a seguir) */}
                            <div className="bg-white border rounded-xl p-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3">Opção de Entrega</h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setOrderType('DELIVERY')} className={`flex-1 py-2 font-bold text-sm rounded-md transition ${orderType === 'DELIVERY' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>Delivery</button>
                                    <button onClick={() => setOrderType('PICKUP')} className={`flex-1 py-2 font-bold text-sm rounded-md transition ${orderType === 'PICKUP' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>Retirada</button>
                                </div>

                                {orderType === 'DELIVERY' && (
                                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{customer.street}, {customer.number}</p>
                                            <p className="text-xs text-gray-500">{customer.neighborhood}</p>
                                            <button className="text-xs font-bold text-primary-600 mt-1 hover:underline">Editar Endereço (em breve)</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pagamento */}
                            <div className="bg-white border rounded-xl p-4 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3">Forma de Pagamento</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'PIX', label: 'Pix' },
                                        { id: 'CREDIT_CARD', label: 'Cartão de Crédito' },
                                        { id: 'DEBIT_CARD', label: 'Cartão de Débito' },
                                        { id: 'CASH', label: 'Dinheiro' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`p-3 border rounded-xl font-bold text-sm transition-all ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {method.label}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'CASH' && (
                                    <div className="mt-4 animate-in fade-in">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Troco para quanto?</label>
                                        <input
                                            type="number"
                                            value={changeFor}
                                            onChange={(e) => setChangeFor(e.target.value)}
                                            placeholder="Ex: 50 pra troco..."
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <button disabled={isLoading} onClick={handlePlaceOrder} className="w-full bg-[#1EA64B] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition shadow-lg shadow-green-500/30 flex justify-between px-6 items-center disabled:opacity-50">
                                <span>Concluir Pedido</span>
                                <span>R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
