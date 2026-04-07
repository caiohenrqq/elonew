import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkersHealthUseCase {
	check(): Promise<{ status: 'ok' }> {
		return Promise.resolve({ status: 'ok' });
	}
}
