export const CHAT_THREAD_WRITER_KEY = Symbol('CHAT_THREAD_WRITER_KEY');

export interface ChatThreadWriterPort {
	createOrderChat(orderId: string): Promise<{ id: string; orderId: string }>;
}
