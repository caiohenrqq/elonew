'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { getButtonClassName } from '@packages/ui/components/button';
import { Card } from '@packages/ui/components/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@packages/ui/components/table';
import { Package, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { MetricCard } from './metric-card';

export const ClientDashboardPage = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			gsap.from('.dashboard-animate', {
				y: 20,
				opacity: 0,
				stagger: 0.1,
				duration: 0.8,
				ease: 'power3.out',
			});
		},
		{ scope: containerRef },
	);

	return (
		<div ref={containerRef} className="space-y-10">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="dashboard-animate">
					<MetricCard label="Pedidos Ativos" value="00">
						<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
							<div className="h-full w-0 bg-hextech-cyan" />
						</div>
					</MetricCard>
				</div>
				<div className="dashboard-animate">
					<MetricCard label="Total Pedidos" value="00">
						<p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
							Nenhum pedido ainda
						</p>
					</MetricCard>
				</div>
				<div className="dashboard-animate">
					<MetricCard label="Total Investido" value="R$ 0,00">
						<p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
							Nenhum pagamento registrado
						</p>
					</MetricCard>
				</div>
			</div>

			<section className="dashboard-animate space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
							Pedidos Recentes
						</h2>
						<p className="text-[10px] text-white/40 tracking-wider">
							Acompanhe o status dos seus serviços contratados.
						</p>
					</div>
					<Link
						href="/client/orders/new"
						className={getButtonClassName({
							size: 'sm',
							className:
								'gap-2 tracking-widest font-black uppercase hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all',
						})}
					>
						<PlusCircle className="w-3 h-3" />
						Novo Pedido
					</Link>
				</div>

				<Card className="overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-[10px] uppercase font-black tracking-widest">
									ID
								</TableHead>
								<TableHead className="text-[10px] uppercase font-black tracking-widest">
									Serviço
								</TableHead>
								<TableHead className="text-[10px] uppercase font-black tracking-widest">
									Detalhes
								</TableHead>
								<TableHead className="text-[10px] uppercase font-black tracking-widest">
									Status
								</TableHead>
								<TableHead className="text-[10px] uppercase font-black tracking-widest">
									Data
								</TableHead>
								<TableHead className="text-[10px] uppercase font-black tracking-widest text-right">
									Ações
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell colSpan={6} className="h-40 text-center">
									<div className="flex flex-col items-center justify-center space-y-3 opacity-40">
										<Package className="w-10 h-10" />
										<p className="text-[10px] font-black uppercase tracking-widest">
											Nenhum pedido encontrado
										</p>
										<p className="max-w-sm text-[10px] text-white/50 leading-relaxed">
											Seus pedidos reais aparecerão aqui assim que o histórico
											estiver disponível.
										</p>
									</div>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</Card>
			</section>
		</div>
	);
};
