export const PASSWORD_HASHER_KEY = Symbol('PASSWORD_HASHER_KEY');

export interface PasswordHasherPort {
	hash(password: string): Promise<string>;
	verify(password: string, passwordHash: string): Promise<boolean>;
}
