'use client';

import { Button } from '@packages/ui/components/button';
import Link from 'next/link';
import { useEffect } from 'react';

const AdminDashboardError = ({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) => {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[55vh] items-center justify-center px-6">
			<div className="w-full max-w-xl rounded-sm border border-red-500/20 bg-red-500/10 p-8 text-center">
				<p className="text-xs font-black uppercase tracking-[0.22em] text-white">
					Não foi possível carregar o painel administrativo.
				</p>
				<p className="mt-3 break-words text-xs leading-6 text-red-100/80">
					{error.message}
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

export default AdminDashboardError;
