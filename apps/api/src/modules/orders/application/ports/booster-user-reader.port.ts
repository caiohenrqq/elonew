import { Role } from '@packages/auth/roles/role';

export const BOOSTER_USER_READER_KEY = Symbol('BOOSTER_USER_READER_KEY');

export type BoosterUser = {
	id: string;
	role: Role;
};

export interface BoosterUserReaderPort {
	findById(id: string): Promise<BoosterUser | null>;
}
