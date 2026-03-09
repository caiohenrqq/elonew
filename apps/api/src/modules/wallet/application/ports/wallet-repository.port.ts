import type { Wallet } from '@modules/wallet/domain/wallet.entity';

export const WALLET_REPOSITORY_KEY = Symbol('WALLET_REPOSITORY_KEY');

export interface WalletRepositoryPort {
	findByBoosterId(boosterId: string): Promise<Wallet | null>;
	findAll(): Promise<Wallet[]>;
	save(wallet: Wallet): Promise<void>;
}
