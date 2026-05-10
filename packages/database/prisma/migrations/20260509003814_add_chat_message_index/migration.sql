-- CreateIndex
CREATE INDEX "chat_messages_chatId_createdAt_id_idx" ON "chat_messages"("chatId", "createdAt", "id");
