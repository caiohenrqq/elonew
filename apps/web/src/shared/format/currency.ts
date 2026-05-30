const brlFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

export const formatBRL = (value: number) => brlFormatter.format(value);

export const formatCurrency = (value: number | null) =>
	value === null ? 'Não informado' : brlFormatter.format(value);
