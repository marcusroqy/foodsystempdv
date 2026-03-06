import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDelivery } from '../../contexts/DeliveryContext';
import type { DeliveryCategory, DeliveryProduct } from '../../contexts/DeliveryContext';

export function DeliveryApp() {
    const { slug } = useParams();
    const { fetchMenu, tenant, menu, isLoading, error } = useDelivery();

    useEffect(() => {
        if (slug) {
            fetchMenu(slug);
        }
    }, [slug]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Cardápio...</div>;
    }

    if (error || !tenant) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">{error || 'Loja não encontrada'}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Banner da Loja */}
            <div className="bg-primary-600 text-white p-6 shadow-md rounded-b-3xl">
                <h1 className="text-2xl font-black">{tenant.name}</h1>
                <p className="opacity-80 text-sm mt-1">{tenant.address || 'Delivery & Retirada'}</p>
            </div>

            {/* Categorias e Produtos (Placeholder) */}
            <div className="p-4 space-y-6 mt-4">
                {menu.map((category: DeliveryCategory) => (
                    <div key={category.id}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{category.name}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {category.products.map((product: DeliveryProduct) => (
                                <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:border-primary-300 transition-colors">
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

            {/* Carrinho Flutuante (Placeholder) */}
            <div className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center cursor-pointer hover:bg-primary-700 transition">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">0</div>
                    <span className="font-medium">Ver carrinho</span>
                </div>
                <div className="font-bold">R$ 0,00</div>
            </div>
        </div>
    );
}
