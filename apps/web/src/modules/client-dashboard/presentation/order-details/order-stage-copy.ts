const orderStageCopy: Record<
	string,
	{
		chatStatus: string;
		headerDescription: string;
	}
> = {
	awaiting_payment: {
		chatStatus: 'Aguardando pagamento',
		headerDescription:
			'Conclua o pagamento para liberar a fila e os próximos dados do pedido.',
	},
	pending_booster: {
		chatStatus: 'Aguardando aceite',
		headerDescription:
			'Seu pedido está na fila aguardando um booster aceitar o serviço.',
	},
	in_progress: {
		chatStatus: 'Ativo',
		headerDescription:
			'O serviço está em andamento. Use o chat para alinhar detalhes com o booster.',
	},
	completed: {
		chatStatus: 'Somente leitura',
		headerDescription:
			'O pedido foi finalizado. Você pode consultar o histórico e avaliar o serviço.',
	},
	cancelled: {
		chatStatus: 'Somente leitura',
		headerDescription:
			'Este pedido foi cancelado. O suporte segue disponível se precisar de ajuda.',
	},
};

export const getOrderStageCopy = (status: string) =>
	orderStageCopy[status] ?? {
		chatStatus: 'Em análise',
		headerDescription: 'Acompanhe as atualizações deste pedido por aqui.',
	};

export const isReadOnlyOrderStatus = (status: string) =>
	status === 'completed' || status === 'cancelled';
