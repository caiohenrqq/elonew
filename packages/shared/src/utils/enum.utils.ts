/**
 * Utility to check if a value is a valid member of an enum.
 * Useful for Zod validation or manual checks.
 */
export function isValidEnum<T extends Record<string, string | number>>(
	enumObj: T,
	value: unknown,
): value is T[keyof T] {
	return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * Utility to get all values of an enum as an array.
 */
export function getEnumValues<T extends Record<string, string | number>>(
	enumObj: T,
): T[keyof T][] {
	return Object.values(enumObj) as T[keyof T][];
}

export function ensurePersistedEnum<TEnum extends Record<string, string>>(
	enumType: TEnum,
	value: string,
	label: string,
): TEnum[keyof TEnum] {
	if (!Object.values(enumType).includes(value)) {
		throw new Error(`Invalid ${label} persisted: ${value}`);
	}

	return value as TEnum[keyof TEnum];
}
