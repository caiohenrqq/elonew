'use client';

import { Button } from '@packages/ui/components/button';
import Link from 'next/link';

const ClientDashboardError = ({ reset }: { reset: () => void }) => {
	return (
		<div className="flex min-h-[55vh] items-center justify-center px-6">
			<div className="w-full max-w-md rounded-sm border border-white/10 bg-white/[0.03] p-8 text-center">
				<p className="text-xs font-black uppercase tracking-[0.22em] text-white">
					Não foi possível carregar o portal do cliente.
				</p>
				<p className="mt-3 text-xs leading-6 text-white/50">
					Tente recarregar os dados. Se a sessão expirou, o acesso será
					redirecionado para login automaticamente.
				</p>
				<div className="mt-6 flex justify-center gap-3">
					<Button type="button" variant="outline" onClick={reset}>
						Tentar novamente
					</Button>
					<Link
						href="/login"
						className="inline-flex h-10 items-center justify-center rounded-sm bg-white px-6 text-[10px] font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-hextech-cyan hover:text-white"
					>
						Entrar
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ClientDashboardError;
