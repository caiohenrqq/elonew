import { getButtonClassName } from '@packages/ui/components/button';
import Link from 'next/link';

const ClientDashboardNotFound = () => {
	return (
		<div className="min-h-[50vh] flex flex-col items-start justify-center gap-4">
			<p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
				Pedido não encontrado.
			</p>
			<Link
				href="/client"
				className={getButtonClassName({ variant: 'primary', size: 'md' })}
			>
				Voltar ao painel
			</Link>
		</div>
	);
};

export default ClientDashboardNotFound;
