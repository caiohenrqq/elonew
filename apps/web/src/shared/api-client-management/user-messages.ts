import { ApiRequestError } from './http';

const apiErrorMap: Record<string, string> = {
	'User email is already in use.': 'Este e-mail já está sendo utilizado.',
	'Username is already in use.':
		'Este nome de usuário já está sendo utilizado.',
	'Invalid credentials.':
		'Não foi possível entrar. Confira seus dados e tente novamente.',
	'Account is inactive.':
		'Não foi possível entrar. Confira seus dados e tente novamente.',
	'Account is blocked.': 'Sua conta está bloqueada.',
	'Invalid confirmation token.': 'Token de confirmação inválido.',
	'Invalid password reset token.': 'Token de definição de senha inválido.',
	'Authentication required.': 'Autenticação necessária.',
	'Insufficient permissions.': 'Permissões insuficientes.',
	'Password setup is unavailable for this user.':
		'Este usuário não pode receber e-mail de definição de senha.',
	'Registration is unavailable.':
		'O cadastro está temporariamente indisponível.',
};

const authMessages = {
	default:
		'Não foi possível continuar. Entre novamente para acessar sua conta.',
	login: 'Não foi possível entrar. Confira seus dados e tente novamente.',
	register:
		'Não foi possível criar sua conta. Confira os dados e tente novamente.',
	confirmEmail:
		'Não foi possível confirmar seu e-mail. O link pode ter expirado ou já ter sido utilizado.',
};

const checkoutMessages = {
	default:
		'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
	invalidInput: 'Confira os dados do pedido e tente novamente.',
};

const couponErrorMap: Record<string, string> = {
	'Coupon was not found.': 'O cupom informado não existe. Verifique o código.',
	'Coupon is inactive.': 'Este cupom está desativado.',
	'Coupon discount configuration is invalid.':
		'Este cupom está com configuração inválida. Tente outro.',
	'Coupon is valid for the first order only.':
		'Este cupom é válido apenas na primeira compra.',
	'Coupon is not valid for this service.':
		'Este cupom não é válido para este serviço.',
	'Coupon is not valid for this queue.':
		'Este cupom não é válido para esta fila.',
	'Coupon is not valid for this account.':
		'Este cupom não está disponível para a sua conta.',
	'Order total is below the coupon minimum.':
		'O valor do pedido é menor que o mínimo exigido pelo cupom.',
	'Order total is above the coupon maximum.':
		'O valor do pedido excede o máximo permitido pelo cupom.',
	'Coupon requires a higher rank.':
		'Este cupom exige um elo mínimo maior que o atual.',
	'Coupon requires a lower rank.':
		'Este cupom exige um elo máximo menor que o atual.',
	'Order does not have enough extras for this coupon.':
		'Este cupom exige mais adicionais no pedido.',
	'Coupon requires a specific extra.':
		'Este cupom exige um adicional específico no pedido.',
	'Coupon usage limit has been reached.':
		'Este cupom atingiu o limite de uso.',
	'You have already used this coupon.':
		'Você já utilizou este cupom o número máximo de vezes.',
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
		return (
			couponErrorMap[error.message] ?? checkoutMessages.invalidInput
		);
	}

	return checkoutMessages.default;
};
