export type LandingServiceIcon = 'trophy' | 'swords' | 'target' | 'zap';

export type LandingService = {
	id: string;
	title: string;
	description: string;
	icon: LandingServiceIcon;
};

export const LANDING_SERVICES: LandingService[] = [
	{
		id: 'elojob',
		title: 'Elo Boost',
		description:
			'Nossos profissionais jogam na sua conta para alcançar o elo desejado com agilidade.',
		icon: 'trophy',
	},
	{
		id: 'duoboost',
		title: 'Duo Boost',
		description:
			'Jogue ao lado de um booster Challenger e evolua enquanto sobe.',
		icon: 'swords',
	},
	{
		id: 'md5',
		title: 'Partidas de colocação',
		description:
			'Garanta seu elo inicial com alta taxa de vitória nas partidas de colocação.',
		icon: 'target',
	},
	{
		id: 'coaching',
		title: 'Coaching elite',
		description:
			'Sessões individuais com jogadores de alto nível para dominar sua rota e campeão.',
		icon: 'zap',
	},
];
