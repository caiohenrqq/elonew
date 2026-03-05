import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseHealthUseCase {
	async check(): Promise<{ status: 'ok' }> {
		return { status: 'ok' };
	}
}
