'use client';

import { Button } from '@packages/ui/components/button';

const ClientDashboardError = ({ reset }: { reset: () => void }) => {
	return (
		<div className="min-h-[50vh] flex flex-col items-start justify-center gap-4">
			<p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
				Não foi possível carregar os dados do pedido.
			</p>
			<Button type="button" onClick={reset}>
				Tentar novamente
			</Button>
		</div>
	);
};

export default ClientDashboardError;
