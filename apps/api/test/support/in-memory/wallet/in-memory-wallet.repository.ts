import type { WalletRepositoryPort } from '@modules/wallet/application/ports/wallet-repository.port';
import type { Wallet } from '@modules/wallet/domain/wallet.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryWalletRepository implements WalletRepositoryPort {
	private readonly wallets = new Map<string, Wallet>();

	findByBoosterId(boosterId: string): Promise<Wallet | null> {
		return Promise.resolve(this.wallets.get(boosterId) ?? null);
	}

	findAll(): Promise<Wallet[]> {
		return Promise.resolve([...this.wallets.values()]);
	}

	save(wallet: Wallet): Promise<void> {
		this.wallets.set(wallet.boosterId, wallet);
		return Promise.resolve();
	}
}
