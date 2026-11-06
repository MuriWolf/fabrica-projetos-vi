import { z } from 'zod'
import { isValidCpf, onlyDigits } from '~/utils/cpf'

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'E-mail é obrigatório')
      .email('E-mail inválido'),

    cpf: z
      .string()
      .min(1, 'CPF é obrigatório')
      .refine(value => isValidCpf(value), 'CPF inválido'),

    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres'),

    confirmPassword: z
      .string()
      .min(1, 'Confirme a senha')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  })
  .transform(data => ({
    ...data,
    email: data.email.trim(),
    cpf: onlyDigits(data.cpf)
  }))

export type RegisterFormData = z.infer<typeof registerSchema>
