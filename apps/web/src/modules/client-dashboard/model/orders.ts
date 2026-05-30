import type {
	ClientDashboardOrderOutput,
	ClientDashboardOrdersOutput,
	GetOrderOutput,
} from '../server/order-contracts';

export type ClientOrder = GetOrderOutput;

export type ClientDashboardOrder = ClientDashboardOrderOutput;

export type ClientDashboard = ClientDashboardOrdersOutput;
