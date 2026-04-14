export type ServiceTypeIcon = 'shield' | 'users';

export type ServiceTypeOption = {
	id: string;
	label: string;
	icon: ServiceTypeIcon;
	description: string;
};

export type ExtraOption = {
	id: string;
	label: string;
	price: string;
};

export type SelectOption = {
	value: string;
	label: string;
};

export const SERVICE_TYPES: ServiceTypeOption[] = [
	{
		id: 'elo_boost',
		label: 'Elo Boost',
		icon: 'shield',
		description: 'Um booster joga na sua conta.',
	},
	{
		id: 'duo_boost',
		label: 'Duo Boost',
		icon: 'users',
		description: 'Você joga em duo com um booster.',
	},
];

export const LEAGUES: SelectOption[] = [
	{ value: 'iron', label: 'Ferro' },
	{ value: 'bronze', label: 'Bronze' },
	{ value: 'silver', label: 'Prata' },
	{ value: 'gold', label: 'Ouro' },
	{ value: 'platinum', label: 'Platina' },
	{ value: 'emerald', label: 'Esmeralda' },
	{ value: 'diamond', label: 'Diamante' },
];

export const DIVISIONS = ['IV', 'III', 'II', 'I'] as const;
export const SERVERS: SelectOption[] = [
	{ value: 'BR', label: 'BR' },
	{ value: 'NA', label: 'NA' },
	{ value: 'EUW', label: 'EUW' },
	{ value: 'EUNE', label: 'EUNE' },
];
export const QUEUES: SelectOption[] = [
	{ value: 'solo_duo', label: 'Solo/Duo' },
	{ value: 'flex', label: 'Flex' },
];

export const EXTRAS: ExtraOption[] = [
	{ id: 'priority_service', label: 'Serviço Prioritário', price: '10%' },
	{ id: 'favorite_booster', label: 'Booster Favorito', price: '10%' },
	{ id: 'offline_chat', label: 'Chat Offline', price: 'Grátis' },
	{ id: 'online_stream', label: 'Streaming Online', price: 'Grátis' },
	{ id: 'specific_champions', label: 'Campeões Específicos', price: 'Grátis' },
];

export const getLeagueLabel = (value: string) => {
	return LEAGUES.find((league) => league.value === value)?.label ?? value;
};
