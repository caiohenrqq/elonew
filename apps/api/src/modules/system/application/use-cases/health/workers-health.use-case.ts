import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkersHealthUseCase {
	async check(): Promise<{ status: 'ok' }> {
		return { status: 'ok' };
	}
}
