export const formatCurrency = (value: string | number) => {
    // Ensure value is string
    const strValue = String(value);

    // Remove everything that is not a digit
    const numbers = strValue.replace(/\D/g, '');
    if (!numbers) return '';

    // Convert to number and divide by 100 to get decimals
    const amount = Number(numbers) / 100;

    // Format as Brazilian currency
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};

export const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    return Number(numbers) / 100;
};

export const formatQuantity = (value: string | number) => {
    const strValue = String(value);

    // Remove tudo exceto números e uma vírgula
    let cleanVal = strValue.replace(/[^0-9,]/g, '');

    // Garante que só tenha uma vírgula
    const parts = cleanVal.split(',');
    if (parts.length > 2) {
        cleanVal = parts[0] + ',' + parts.slice(1).join('');
    }

    return cleanVal;
};

export const parseQuantity = (value: string): number => {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
};
