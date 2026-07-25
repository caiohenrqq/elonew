import { Clock, Cpu, ListChecks } from 'lucide-react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { formatDateTime } from '@/shared/format/date';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import type { AdminScheduledJobsOutput } from '../../server/admin-contracts';

type AdminScheduledJobsPageProps = {
	scheduledJobs: AdminScheduledJobsOutput;
};

const CountBadge = ({ label, value }: { label: string; value: number }) => (
	<div className="rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2">
		<p className="text-[10px] font-black uppercase tracking-widest text-white/40">
			{label}
		</p>
		<p className="text-sm font-black text-white">
			{value.toString().padStart(2, '0')}
		</p>
	</div>
);

export const AdminScheduledJobsPage = ({
	scheduledJobs,
}: AdminScheduledJobsPageProps) => (
	<div className="space-y-8">
		<div className="space-y-2">
			<h1 className="text-2xl font-black uppercase tracking-tight text-white">
				Trabalhos agendados
			</h1>
			<p className="text-sm text-white/55">
				Toda rotina recorrente é declarada no código e agendada pelo container
				de workers. Não existe cron no host.
			</p>
		</div>

		{scheduledJobs.queues.map((queue) => (
			<Card key={queue.queueName} className="border-white/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ListChecks className="h-4 w-4 text-hextech-cyan" />
						<span className="font-mono">{queue.queueName}</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
						<CountBadge label="Agendados" value={queue.counts.delayed} />
						<CountBadge label="Na fila" value={queue.counts.waiting} />
						<CountBadge label="Ativos" value={queue.counts.active} />
						<CountBadge label="Falhas" value={queue.counts.failed} />
						<CountBadge label="Concluídos" value={queue.counts.completed} />
					</div>

					{queue.schedulers.length === 0 ? (
						<DashboardEmptyState
							icon={Clock}
							title="Nenhuma rotina recorrente nesta fila"
							description="Esta fila só recebe jobs sob demanda."
						/>
					) : (
						<div className="divide-y divide-white/5">
							{queue.schedulers.map((scheduler) => (
								<div
									key={scheduler.name}
									className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0">
										<p className="truncate text-xs font-bold text-white">
											{scheduler.name}
										</p>
										<p className="font-mono text-[10px] text-white/40">
											{scheduler.cron ?? 'sem expressão cron'}
										</p>
									</div>
									<p className="text-xs text-white/55">
										{scheduler.nextRunAt
											? `Próxima execução ${formatDateTime(scheduler.nextRunAt)}`
											: 'Próxima execução indefinida'}
									</p>
								</div>
							))}
						</div>
					)}

					{queue.pending.length > 0 ? (
						<div className="space-y-2 border-t border-white/5 pt-4">
							<p className="text-[10px] font-black uppercase tracking-widest text-white/40">
								Próximos jobs agendados
							</p>
							{queue.pending.map((job) => (
								<div
									key={job.id}
									className="flex items-center justify-between gap-3"
								>
									<p className="truncate font-mono text-[10px] text-white/45">
										{job.id}
									</p>
									<p className="text-xs text-white/55">
										{job.dueAt ? formatDateTime(job.dueAt) : 'sem data'}
									</p>
								</div>
							))}
						</div>
					) : null}
				</CardContent>
			</Card>
		))}

		<Card className="border-white/10">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Cpu className="h-4 w-4 text-warning" />
					Rotinas em processo
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<p className="text-xs text-white/45">
					Estas rotinas rodam dentro do processo da API e não aparecem no Redis.
				</p>
				{scheduledJobs.inProcess.map((job) => (
					<div key={job.name} className="space-y-1">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs font-bold text-white">{job.name}</p>
							<p className="text-xs text-white/55">{job.interval}</p>
						</div>
						<p className="truncate font-mono text-[10px] text-white/35">
							{job.location}
						</p>
					</div>
				))}
			</CardContent>
		</Card>
	</div>
);
