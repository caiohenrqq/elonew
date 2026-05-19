import { notificationIdParamSchema } from '@packages/shared/notifications/notification.schema';
import type { z } from 'zod';

export {
	type ListNotificationsQuery,
	listNotificationsQuerySchema,
	type MarkNotificationReadInput,
	markNotificationReadSchema,
	notificationIdParamSchema,
} from '@packages/shared/notifications/notification.schema';

export type NotificationIdParamSchemaInput = z.infer<
	typeof notificationIdParamSchema
>;
