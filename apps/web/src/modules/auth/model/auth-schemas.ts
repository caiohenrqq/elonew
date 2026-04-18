import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z.string().trim().email('Dados inválidos.'),
	password: z.string().trim().min(1, 'Dados inválidos.'),
});

export const registerFormSchema = z.object({
	username: z.string().trim().min(1, 'Informe seu nome de usuário.'),
	email: z.string().trim().email('Dados inválidos.'),
	password: z.string().min(12, 'A senha deve ter pelo menos 12 caracteres.'),
	termsAccepted: z
		.boolean()
		.refine((accepted) => accepted, 'Aceite os termos para continuar.'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
