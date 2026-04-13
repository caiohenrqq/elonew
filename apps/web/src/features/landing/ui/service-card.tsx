import { Swords, Target, Trophy, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import type { LandingService, LandingServiceIcon } from '../model/services';

const SERVICE_ICONS: Record<
	LandingServiceIcon,
	ComponentType<{ className?: string; size?: number; strokeWidth?: number }>
> = {
	swords: Swords,
	target: Target,
	trophy: Trophy,
	zap: Zap,
};

type ServiceCardProps = {
	index: number;
	service: LandingService;
};

export function ServiceCard({ index, service }: ServiceCardProps) {
	const Icon = SERVICE_ICONS[service.icon];

	return (
		<div className="service-card flex-shrink-0 w-[80vw] md:w-[28vw] aspect-[16/11] group relative p-8 bg-[#111113] border border-white/5 hover:border-[#0ea5e9]/40 transition-colors duration-500 rounded-sm flex flex-col justify-end overflow-hidden cursor-pointer shadow-2xl">
			<span className="absolute top-0 left-0 text-[10rem] font-black text-white/[0.02] leading-none select-none -translate-x-6 -translate-y-6">
				0{index + 1}
			</span>

			<div className="card-icon-bg absolute top-0 right-0 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
				<Icon size={180} strokeWidth={0.5} />
			</div>

			<div className="relative z-10 flex flex-col justify-between h-full whitespace-normal">
				<div className="w-12 h-12 flex items-center justify-center rounded-sm bg-[#09090b] border border-white/5 mb-4 group-hover:border-[#0ea5e9]/30 transition-all duration-500">
					<Icon className="text-[#0ea5e9]" size={24} />
				</div>

				<div>
					<h4 className="text-2xl font-black uppercase mb-1 tracking-tight text-white group-hover:text-[#0ea5e9] transition-colors duration-500">
						{service.title}
					</h4>
					<p className="text-white/40 text-xs leading-relaxed group-hover:text-white/70 transition-colors duration-500 font-medium line-clamp-2">
						{service.description}
					</p>
				</div>

				<div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#0ea5e9] group-hover:gap-6 transition-all duration-500 mt-4">
					<span>Configurar</span>
					<span className="text-lg">&rarr;</span>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#0ea5e9] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
		</div>
	);
}
