import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z.string().trim().email('Informe um e-mail válido.'),
	password: z.string().trim().min(1, 'Informe sua senha.'),
});

export const registerFormSchema = z.object({
	username: z.string().trim().min(1, 'Informe seu nome de usuário.'),
	email: z.string().trim().email('Informe um e-mail válido.'),
	password: z.string().min(12, 'A senha deve ter pelo menos 12 caracteres.'),
	termsAccepted: z
		.boolean()
		.refine((accepted) => accepted, 'Aceite os termos para continuar.'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
