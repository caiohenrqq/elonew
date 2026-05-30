import { formatBRL, formatCurrency } from './currency';
import { formatDate, formatDateTime } from './date';
import {
	formatGovernanceAction,
	formatOrderRoute,
	formatServiceType,
} from './orders';
import { formatTitleCase } from './text';

describe('currency formatters', () => {
	it('formats numbers as BRL', () => {
		expect(formatBRL(120)).toMatch(/R\$\s*120,00/);
	});

	it('returns a fallback for null amounts', () => {
		expect(formatCurrency(null)).toBe('Não informado');
		expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
	});
});

describe('date formatters', () => {
	it('formats an ISO date in UTC', () => {
		expect(formatDate('2026-05-01T00:00:00.000Z')).toBe('01/05/2026');
	});

	it('formats date and time', () => {
		expect(formatDateTime('2026-05-01T13:30:00.000Z')).toMatch(/01\/05\/2026/);
	});

	it('returns a fallback for null dates', () => {
		expect(formatDate(null)).toBe('Não informado');
		expect(formatDateTime(null)).toBe('Não informado');
	});
});

describe('text formatter', () => {
	it('title-cases snake_case values', () => {
		expect(formatTitleCase('elo_boost')).toBe('Elo Boost');
		expect(formatTitleCase('solo-duo')).toBe('Solo Duo');
	});
});

describe('order display formatters', () => {
	it('formats a complete route with a single arrow style', () => {
		expect(
			formatOrderRoute({
				currentLeague: 'gold',
				currentDivision: 'II',
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
			}),
		).toBe('Gold II → Platinum IV');
	});

	it('falls back when route data is incomplete', () => {
		expect(
			formatOrderRoute({
				currentLeague: null,
				currentDivision: 'II',
				desiredLeague: 'platinum',
				desiredDivision: 'IV',
			}),
		).toBe('Rota indisponível');
	});

	it('formats service types with a fallback', () => {
		expect(formatServiceType('elo_boost')).toBe('Elo Boost');
		expect(formatServiceType(null)).toBe('Serviço indisponível');
	});

	it('maps governance actions to labels', () => {
		expect(formatGovernanceAction('block_user')).toBe('Bloqueio de usuário');
		expect(formatGovernanceAction('unknown_action')).toBe('Unknown Action');
	});
});
