import type { OrderServiceType } from '@packages/shared/orders/service-type';
import { ServiceType } from '@prisma/client';

export function mapServiceTypeToDomain(
	serviceType: ServiceType,
): OrderServiceType {
	switch (serviceType) {
		case ServiceType.ELO_BOOST:
			return 'elo_boost';
		case ServiceType.DUO_BOOST:
			return 'duo_boost';
		case ServiceType.MD5:
			return 'md5';
		case ServiceType.COACHING:
			return 'coaching';
	}
}

export function mapServiceTypeToPersistence(
	serviceType: OrderServiceType,
): ServiceType {
	switch (serviceType) {
		case 'elo_boost':
			return ServiceType.ELO_BOOST;
		case 'duo_boost':
			return ServiceType.DUO_BOOST;
		case 'md5':
			return ServiceType.MD5;
		case 'coaching':
			return ServiceType.COACHING;
	}
}
