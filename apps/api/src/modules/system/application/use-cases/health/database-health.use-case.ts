import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseHealthUseCase {
	check(): Promise<{ status: 'ok' }> {
		return Promise.resolve({ status: 'ok' });
	}
}
