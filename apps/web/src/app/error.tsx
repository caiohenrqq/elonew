'use client';

import { Button } from '@packages/ui/components/button';
import { useEffect } from 'react';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center space-y-4 px-4 text-center">
			<h2 className="text-2xl font-black uppercase tracking-widest text-white">
				Algo deu errado!
			</h2>
			<p className="max-w-md text-sm text-white/40">
				Ocorreu um erro inesperado. Nossa equipe já foi notificada e estamos
				trabalhando para resolver.
			</p>
			<div className="flex gap-4">
				<Button variant="outline" onClick={() => window.location.reload()}>
					Recarregar Página
				</Button>
				<Button onClick={() => reset()}>Tentar Novamente</Button>
			</div>
		</div>
	);
}
