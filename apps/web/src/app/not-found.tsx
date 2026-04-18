import { Button } from '@packages/ui/components/button';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="flex h-screen w-full flex-col items-center justify-center space-y-4 px-4 text-center">
			<h1 className="text-6xl font-black text-hextech-cyan">404</h1>
			<h2 className="text-2xl font-black uppercase tracking-widest text-white">
				Página não encontrada
			</h2>
			<p className="max-w-md text-sm text-white/40">
				O link que você seguiu pode estar quebrado ou a página pode ter sido
				removida.
			</p>
			<Link href="/">
				<Button>Voltar para o Início</Button>
			</Link>
		</div>
	);
}
