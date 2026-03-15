import {
	type ApiHttpApp,
	createTestingHttpApp,
	initializeHttpApp,
} from '@app/common/http/http-app.factory';
import type { TestingModule } from '@nestjs/testing';

export async function createTestHttpApp(
	moduleRef: TestingModule,
): Promise<ApiHttpApp> {
	return initializeHttpApp(createTestingHttpApp(moduleRef));
}

type TestResponse<T = unknown> = {
	body: T;
	headers: Record<string, string | string[] | number | undefined>;
	status: number;
};

type ExpectHandler = (response: TestResponse) => void | Promise<void>;
type InjectRequestOptions = Exclude<
	Parameters<ApiHttpApp['inject']>[0],
	string
>;

class InjectRequestBuilder {
	private readonly headers: Record<string, string> = {};
	private payload: unknown;
	private readonly expectations: ExpectHandler[] = [];

	constructor(
		private readonly app: ApiHttpApp,
		private readonly method: 'GET' | 'POST',
		private readonly url: string,
	) {}

	set(name: string, value: string): this {
		this.headers[name] = value;

		return this;
	}

	send(payload: unknown): this {
		this.payload = payload;

		return this;
	}

	expect(status: number, body?: unknown): this;
	expect<T>(
		assertion: (response: TestResponse<T>) => void | Promise<void>,
	): this;
	expect(statusOrAssertion: number | ExpectHandler, body?: unknown): this {
		if (typeof statusOrAssertion === 'function') {
			this.expectations.push(statusOrAssertion as ExpectHandler);

			return this;
		}

		const expectedBody = body;

		this.expectations.push(({ body: responseBody, status }) => {
			expect(status).toBe(statusOrAssertion);
			if (expectedBody !== undefined)
				expect(responseBody).toEqual(expectedBody);
		});

		return this;
	}

	async execute(): Promise<void> {
		const response = await this.app.inject({
			method: this.method,
			url: this.url,
			headers: this.headers,
			payload: this.payload as InjectRequestOptions['payload'],
		});
		const body = this.parseBody(response.body);

		for (const expectation of this.expectations) {
			await expectation({
				body,
				headers: response.headers,
				status: response.statusCode,
			});
		}
	}

	private parseBody(body: string): unknown {
		if (!body) return undefined;

		try {
			return JSON.parse(body);
		} catch {
			return body;
		}
	}
}

export function requestHttp(app: ApiHttpApp) {
	return {
		get(url: string) {
			return new InjectRequestBuilder(app, 'GET', url);
		},
		post(url: string) {
			return new InjectRequestBuilder(app, 'POST', url);
		},
	};
}
