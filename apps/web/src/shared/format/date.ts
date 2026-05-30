const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
	dateStyle: 'short',
	timeStyle: 'short',
});

export const formatDate = (value: string | null) =>
	value ? dateFormatter.format(new Date(value)) : 'Não informado';

export const formatDateTime = (value: string | null) =>
	value ? dateTimeFormatter.format(new Date(value)) : 'Não informado';
