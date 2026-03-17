import type { PasswordHasherPort } from '@modules/users/application/ports/password-hasher.port';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
	async hash(password: string): Promise<string> {
		return argon2.hash(password);
	}

	async verify(password: string, passwordHash: string): Promise<boolean> {
		return argon2.verify(passwordHash, password);
	}
}
