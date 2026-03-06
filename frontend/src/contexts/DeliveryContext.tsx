import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from './AuthContext';

export interface DeliveryProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
}

export interface DeliveryCategory {
    id: string;
    name: string;
    products: DeliveryProduct[];
}

export interface CartItem {
    product: DeliveryProduct;
    quantity: number;
    notes?: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    street?: string;
    number?: string;
    neighborhood?: string;
}

interface DeliveryContextData {
    tenant: any;
    menu: DeliveryCategory[];
    cart: CartItem[];
    customer: Customer | null;
    cartTotal: number;
    cartCount: number;
    isLoading: boolean;
    error: string | null;
    addToCart: (product: DeliveryProduct, quantity: number, notes?: string) => void;
    updateCartItem: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    setCustomer: (customer: Customer | null) => void;
    login: (token: string, customerData: Customer) => void;
    logout: () => void;
    fetchMenu: (slug: string) => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextData>({} as DeliveryContextData);

export function DeliveryProvider({ children }: { children: ReactNode }) {
    const [tenant, setTenant] = useState<any>(null);
    const [menu, setMenu] = useState<DeliveryCategory[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomerState] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize from localStorage on load
    useEffect(() => {
        const savedCart = localStorage.getItem('@FoodSystem:DeliveryCart');
        const savedCustomer = localStorage.getItem('@FoodSystem:Customer');

        if (savedCart) {
            try { setCart(JSON.parse(savedCart)); } catch (e) { }
        }
        if (savedCustomer) {
            try { setCustomerState(JSON.parse(savedCustomer)); } catch (e) { }
        }
    }, []);

    // Save cart to Storage automatically
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('@FoodSystem:DeliveryCart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('@FoodSystem:DeliveryCart');
        }
    }, [cart]);

    const addToCart = (product: DeliveryProduct, quantity: number, notes?: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id && item.notes === notes);
            if (existing) {
                return prev.map(item =>
                    item === existing ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { product, quantity, notes }];
        });
    };

    const updateCartItem = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const login = (token: string, customerData: Customer) => {
        localStorage.setItem('@FoodSystem:CustomerToken', token);
        localStorage.setItem('@FoodSystem:Customer', JSON.stringify(customerData));
        setCustomerState(customerData);
    };

    const logout = () => {
        localStorage.removeItem('@FoodSystem:CustomerToken');
        localStorage.removeItem('@FoodSystem:Customer');
        setCustomerState(null);
    };

    const fetchMenu = async (slug: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const [tenantRes, menuRes] = await Promise.all([
                api.get(`/delivery/${slug}`),
                api.get(`/delivery/${slug}/menu`)
            ]);
            setTenant(tenantRes.data);
            setMenu(menuRes.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Erro ao carregar cardápio');
        } finally {
            setIsLoading(false);
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <DeliveryContext.Provider value={{
            tenant, menu, cart, customer, cartTotal, cartCount, isLoading, error,
            addToCart, updateCartItem, removeFromCart, clearCart, setCustomer: setCustomerState,
            login, logout, fetchMenu
        }}>
            {children}
        </DeliveryContext.Provider>
    );
}

export function useDelivery() {
    return useContext(DeliveryContext);
}
