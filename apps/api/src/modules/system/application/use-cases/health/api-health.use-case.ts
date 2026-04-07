import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiHealthUseCase {
	check(): Promise<{ status: 'ok' }> {
		return Promise.resolve({ status: 'ok' });
	}
}
