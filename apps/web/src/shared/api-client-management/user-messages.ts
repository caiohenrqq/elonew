import { ApiRequestError } from './http';

const apiErrorMap: Record<string, string> = {
	'User email is already in use.': 'Este e-mail já está sendo utilizado.',
	'Username is already in use.':
		'Este nome de usuário já está sendo utilizado.',
	'Invalid credentials.': 'E-mail ou senha incorretos.',
	'Account is inactive.': 'Sua conta está inativa.',
	'Account is blocked.': 'Sua conta está bloqueada.',
	'Invalid confirmation token.': 'Token de confirmação inválido.',
	'Authentication required.': 'Autenticação necessária.',
	'Insufficient permissions.': 'Permissões insuficientes.',
	'Registration is unavailable.':
		'O cadastro está temporariamente indisponível.',
};

const authMessages = {
	default:
		'Não foi possível continuar. Entre novamente para acessar sua conta.',
	login: 'Não foi possível entrar. Confira seus dados e tente novamente.',
	register:
		'Não foi possível criar sua conta. Confira os dados e tente novamente.',
};

const checkoutMessages = {
	default:
		'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
	invalidInput: 'Confira os dados do pedido e tente novamente.',
};

export const getAuthErrorMessage = (
	error: unknown,
	context: keyof typeof authMessages = 'default',
) => {
	if (error instanceof ApiRequestError) {
		if (error.status >= 500) {
			return 'Não foi possível conectar ao servidor agora. Tente novamente em instantes.';
		}

		if (error.status >= 400 && error.status < 500) {
			return apiErrorMap[error.message] ?? error.message;
		}
	}

	if (error instanceof TypeError && error.message === 'fetch failed') {
		return 'Não foi possível conectar ao servidor. Verifique se a API está online.';
	}

	return authMessages[context];
};

export const getCheckoutErrorMessage = (error: unknown) => {
	if (error instanceof ApiRequestError && error.status === 400) {
		return checkoutMessages.invalidInput;
	}

	return checkoutMessages.default;
};
