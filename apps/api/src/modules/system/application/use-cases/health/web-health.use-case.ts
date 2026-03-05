import { Injectable } from '@nestjs/common';

@Injectable()
export class WebHealthUseCase {
	async check(): Promise<{ status: 'ok' }> {
		return { status: 'ok' };
	}
}
