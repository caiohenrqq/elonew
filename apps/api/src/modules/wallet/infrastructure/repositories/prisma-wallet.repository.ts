import { PrismaService } from '@app/common/prisma/prisma.service';
import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import type {
	WalletTransactionReaderPort,
	WalletTransactionSnapshot,
} from '@modules/wallet/application/ports/wallet-transaction-reader.port';
import {
	Wallet,
	type WalletTransaction,
	type WalletTransactionReason,
	type WalletTransactionType,
} from '@modules/wallet/domain/wallet.entity';
import { Injectable } from '@nestjs/common';

type WalletRecord = {
	id: string;
	boosterId: string;
	balanceLocked: number;
	balanceWithdrawable: number;
	transactions: Array<{
		orderId: string | null;
		amount: number;
		type: 'CREDIT' | 'DEBIT';
		reason: string;
		availableAt: Date;
		releasedAt: Date | null;
		createdAt: Date;
	}>;
};

type WalletDelegate = {
	findUnique(args: {
		where: { boosterId: string };
		include: { transactions: { orderBy: { createdAt: 'asc' } } };
	}): Promise<WalletRecord | null>;
	findUnique(args: {
		where: { boosterId: string };
		select: { id: true };
	}): Promise<{ id: string } | null>;
	findMany(args: {
		include: { transactions: { orderBy: { createdAt: 'asc' } } };
	}): Promise<WalletRecord[]>;
	upsert(args: {
		where: { boosterId: string };
		create: {
			boosterId: string;
			balanceLocked: number;
			balanceWithdrawable: number;
		};
		update: {
			balanceLocked: number;
			balanceWithdrawable: number;
		};
	}): Promise<{ id: string }>;
};

type WalletTransactionDelegate = {
	deleteMany(args: { where: { walletId: string } }): Promise<{ count: number }>;
	createMany(args: {
		data: Array<{
			walletId: string;
			orderId: string | null;
			amount: number;
			type: 'CREDIT' | 'DEBIT';
			reason: string;
			availableAt: Date;
			releasedAt: Date | null;
			createdAt: Date;
		}>;
	}): Promise<{ count: number }>;
	findMany(args: {
		where: { walletId: string };
		orderBy: { createdAt: 'desc' };
		take: number;
	}): Promise<Array<WalletRecord['transactions'][number] & { id: string }>>;
};

type WalletPrismaClient = {
	wallet: WalletDelegate;
	walletTransaction: WalletTransactionDelegate;
};

@Injectable()
export class PrismaWalletRepository
	implements WalletRepositoryPort, WalletTransactionReaderPort
{
	constructor(private readonly prisma: PrismaService) {}

	async findByBoosterId(boosterId: string): Promise<Wallet | null> {
		const record = await this.getWalletDelegate().findUnique({
			where: { boosterId },
			include: { transactions: { orderBy: { createdAt: 'asc' } } },
		});
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findAll(): Promise<Wallet[]> {
		const records = await this.getWalletDelegate().findMany({
			include: { transactions: { orderBy: { createdAt: 'asc' } } },
		});

		return records.map((record) => this.mapRecordToDomain(record));
	}

	async findRecentForBooster(
		boosterId: string,
		limit: number,
	): Promise<WalletTransactionSnapshot[] | null> {
		const wallet = await this.getWalletDelegate().findUnique({
			where: { boosterId },
			select: { id: true },
		});
		if (!wallet) return null;

		const records = await this.getWalletTransactionDelegate().findMany({
			where: { walletId: wallet.id },
			orderBy: { createdAt: 'desc' },
			take: limit,
		});

		return records.map((transaction) => ({
			id: transaction.id,
			...this.mapTransactionToDomain(transaction),
		}));
	}

	async save(wallet: Wallet): Promise<void> {
		const persistedWallet = await this.getWalletDelegate().upsert({
			where: { boosterId: wallet.boosterId },
			create: {
				boosterId: wallet.boosterId,
				balanceLocked: wallet.balanceLocked,
				balanceWithdrawable: wallet.balanceWithdrawable,
			},
			update: {
				balanceLocked: wallet.balanceLocked,
				balanceWithdrawable: wallet.balanceWithdrawable,
			},
		});

		await this.getWalletTransactionDelegate().deleteMany({
			where: { walletId: persistedWallet.id },
		});

		if (wallet.transactions.length === 0) return;

		await this.getWalletTransactionDelegate().createMany({
			data: wallet.transactions.map((transaction) => ({
				walletId: persistedWallet.id,
				orderId: transaction.orderId,
				amount: transaction.amount,
				type: this.mapTransactionTypeToRecord(transaction.type),
				reason: transaction.reason,
				availableAt: transaction.availableAt,
				releasedAt: transaction.releasedAt,
				createdAt: transaction.createdAt,
			})),
		});
	}

	private getWalletDelegate(): WalletDelegate {
		return (this.prisma as unknown as WalletPrismaClient).wallet;
	}

	private getWalletTransactionDelegate(): WalletTransactionDelegate {
		return (this.prisma as unknown as WalletPrismaClient).walletTransaction;
	}

	private mapRecordToDomain(record: WalletRecord): Wallet {
		return Wallet.rehydrate({
			boosterId: record.boosterId,
			balanceLocked: record.balanceLocked,
			balanceWithdrawable: record.balanceWithdrawable,
			transactions: record.transactions.map((transaction) =>
				this.mapTransactionToDomain(transaction),
			),
		});
	}

	private mapTransactionToDomain(
		transaction: WalletRecord['transactions'][number],
	): WalletTransaction {
		return {
			orderId: transaction.orderId,
			amount: transaction.amount,
			type: this.mapTransactionTypeToDomain(transaction.type),
			reason: transaction.reason as WalletTransactionReason,
			availableAt: transaction.availableAt,
			releasedAt: transaction.releasedAt,
			createdAt: transaction.createdAt,
		};
	}

	private mapTransactionTypeToDomain(
		type: WalletRecord['transactions'][number]['type'],
	): WalletTransactionType {
		return type === 'CREDIT' ? 'credit' : 'debit';
	}

	private mapTransactionTypeToRecord(
		type: WalletTransactionType,
	): 'CREDIT' | 'DEBIT' {
		return type === 'credit' ? 'CREDIT' : 'DEBIT';
	}
}
