import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiHealthUseCase {
	async check(): Promise<{ status: 'ok' }> {
		return { status: 'ok' };
	}
}
