import { Injectable } from '@nestjs/common';

@Injectable()
export class WebHealthUseCase {
	check(): Promise<{ status: 'ok' }> {
		return Promise.resolve({ status: 'ok' });
	}
}
