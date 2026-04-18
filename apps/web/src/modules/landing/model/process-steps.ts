export type ProcessStep = {
	title: string;
	description: string;
	number: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
	{
		title: 'Solicite seu serviço',
		description:
			'Escolha entre Elojob, Duo Boost, Md5 e Coaching. Personalize seu pedido com extras específicos.',
		number: '01',
	},
	{
		title: 'Pagamento seguro',
		description:
			'Pague com segurança via Mercado Pago usando cartão, PIX ou boleto. O pagamento fica protegido até a finalização do serviço.',
		number: '02',
	},
	{
		title: 'Escolha do booster',
		description:
			'Depois da confirmação do pagamento, escolha seu booster preferido ou aguarde um profissional de alto nível aceitar o pedido.',
		number: '03',
	},
	{
		title: 'Acompanhe o progresso',
		description:
			'Fale diretamente com seu booster e acompanhe o status do pedido em tempo real até alcançar seu objetivo.',
		number: '04',
	},
];
