import {
	ADMIN_DASHBOARD_READER_KEY,
	type AdminDashboardReaderPort,
	type AdminMetricsSnapshot,
	type AdminOrderSnapshot,
	type AdminSupportTicketSnapshot,
	type AdminUserSnapshot,
} from '@modules/admin/application/ports/admin-dashboard-reader.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetAdminDashboardUseCase {
	constructor(
		@Inject(ADMIN_DASHBOARD_READER_KEY)
		private readonly reader: AdminDashboardReaderPort,
	) {}

	async getMetrics(): Promise<AdminMetricsSnapshot> {
		return await this.reader.getMetrics();
	}

	async listUsers(input: {
		query?: string;
		limit: number;
	}): Promise<AdminUserSnapshot[]> {
		return await this.reader.listUsers(input);
	}

	async listOrders(input: { limit: number }): Promise<AdminOrderSnapshot[]> {
		return await this.reader.listOrders(input);
	}

	async listSupportTickets(input: {
		limit: number;
	}): Promise<AdminSupportTicketSnapshot[]> {
		return await this.reader.listSupportTickets(input);
	}
}
