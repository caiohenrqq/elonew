export const ORDER_CLIENT_READER_KEY = Symbol('ORDER_CLIENT_READER_KEY');

export interface OrderClientReaderPort {
	findEmailById(clientId: string): Promise<string | null>;
	hasPaidOrder(clientId: string): Promise<boolean>;
}
