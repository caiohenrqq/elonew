export type ServiceTypeIcon = 'shield' | 'users';

export type ServiceTypeOption = {
	id: string;
	label: string;
	icon: ServiceTypeIcon;
	description: string;
};

export type ExtraOption = {
	description: string;
	id: string;
	label: string;
	price: string;
	priceLabel: string;
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
	{ value: 'master', label: 'Master' },
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
	{
		id: 'mmr_nerfed',
		label: 'Taxa MMR Nerfado',
		price: '25%',
		priceLabel: '+ 25%',
		description:
			'Se seu ganho de PDL é menor ou igual a 17, isso aumenta a dificuldade para nossos boosters.',
	},
	{
		id: 'mmr_buffed',
		label: 'Taxa MMR Buffado',
		price: '35%',
		priceLabel: '+ 35%',
		description:
			'Marque esta opção caso esteja caindo em filas superiores ao elo contratado. Sempre verificaremos antes de iniciarmos o pedido. Caso contrário, o valor da compra será convertido em vitórias do elo contratado.',
	},
	{
		id: 'offline_chat',
		label: 'Chat Offline',
		price: 'Grátis',
		priceLabel: 'Grátis',
		description: 'Desejo que o serviço seja feito no modo Offline.',
	},
	{
		id: 'spell_position',
		label: 'Posição de Feitiços',
		price: 'Grátis',
		priceLabel: 'Grátis',
		description: 'Desejo escolher a posição do Feitiço FLASH (D ou F).',
	},
	{
		id: 'specific_lanes',
		label: 'Rotas Específicas',
		price: 'Grátis',
		priceLabel: 'Grátis',
		description: 'Desejo determinar as rotas prioritárias para o serviço.',
	},
	{
		id: 'priority_service',
		label: 'Serviço Prioritário',
		price: '10%',
		priceLabel: '+ 10%',
		description: 'Desejo que esse serviço seja feito de forma prioritária.',
	},
	{
		id: 'favorite_booster',
		label: 'Booster Favorito',
		price: '10%',
		priceLabel: '+ 10%',
		description:
			'Desejo escolher meu Booster Favorito. Se o Booster escolhido estiver realizando outro serviço, este tem prioridade; logo após será iniciado o seu serviço.',
	},
	{
		id: 'super_restriction',
		label: 'Super Restrição',
		price: '35%',
		priceLabel: '+ 35%',
		description: 'Desejo limitar bastante os campeões.',
	},
	{
		id: 'extra_win',
		label: 'Vitória extra',
		price: '20%',
		priceLabel: '+ 20%',
		description: 'Desejo uma vitória adicional ao término do serviço.',
	},
	{
		id: 'specific_champions',
		label: 'Campeões Específicos',
		price: 'Grátis',
		priceLabel: 'Grátis',
		description: 'Desejo determinar os campeões prioritários para o serviço.',
	},
	{
		id: 'restricted_schedule',
		label: 'Horários Restritos',
		price: '10%',
		priceLabel: '+ 10%',
		description:
			'Desejo determinar horários específicos para a execução do serviço.',
	},
	{
		id: 'online_stream',
		label: 'Stream Online',
		price: 'Grátis',
		priceLabel: 'Grátis',
		description: 'Desejo assistir Stream durante a execução do serviço.',
	},
	{
		id: 'kd_reduction',
		label: 'Redução do KD',
		price: '30%',
		priceLabel: '+ 30%',
		description: 'Desejo reduzir meu KD durante o serviço.',
	},
	{
		id: 'deadline_reduction',
		label: 'Redução no Prazo de Entrega',
		price: '20%',
		priceLabel: '+ 20%',
		description: 'Desejo diminuir o prazo de entrega em 30%.',
	},
	{
		id: 'solo_service',
		label: 'Serviço Solo',
		price: '30%',
		priceLabel: '+ 30%',
		description: 'Desejo que as partidas sejam jogadas Solo.',
	},
];

export const EXTRA_OPTIONS_BY_ID = new Map(
	EXTRAS.map((extra) => [extra.id, extra]),
);

export const getExtraLabel = (value: string) => {
	return EXTRA_OPTIONS_BY_ID.get(value)?.label ?? value;
};

export const getLeagueLabel = (value: string) => {
	return LEAGUES.find((league) => league.value === value)?.label ?? value;
};

export const getDivisionLabel = (value: string) => {
	return value === 'MASTER' ? 'Sem divisão' : value;
};
