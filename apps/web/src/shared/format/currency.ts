import { Money } from '@packages/shared/money/money';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

export const formatBRL = (cents: number) =>
	brlFormatter.format(Money.fromCents(Math.round(cents)).toDecimal());

export const formatCurrency = (cents: number | null) =>
	cents === null
		? 'Não informado'
		: brlFormatter.format(Money.fromCents(Math.round(cents)).toDecimal());
