import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import type { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryWalletRepository implements WalletRepositoryPort {
	private readonly wallets = new Map<string, Wallet>();

	async findByBoosterId(boosterId: string): Promise<Wallet | null> {
		return this.wallets.get(boosterId) ?? null;
	}

	async findAll(): Promise<Wallet[]> {
		return [...this.wallets.values()];
	}

	async save(wallet: Wallet): Promise<void> {
		this.wallets.set(wallet.boosterId, wallet);
	}
}
