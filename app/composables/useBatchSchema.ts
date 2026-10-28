import { z } from 'zod'

export const batchSchema = z
  .object({
    medicineId: z.string().min(1, 'Selecione um medicamento'),

    batchNumber: z
      .string()
      .min(1, 'Número do lote é obrigatório')
      .max(50, 'Máximo de 50 caracteres'),

    fabricationDate: z
      .string()
      .min(1, 'Data de fabricação é obrigatória'),

    expirationDate: z
      .string()
      .min(1, 'Data de vencimento é obrigatória'),

    quantity: z.coerce
      .number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser maior que 0')
  })
  // Comparação entre dois campos → refine no objeto, não no campo
  .refine(
    data => new Date(data.expirationDate) > new Date(data.fabricationDate),
    {
      message: 'A data de vencimento deve ser posterior à data de fabricação',
      path: ['expirationDate'] // faz o erro aparecer no campo certo
    }
  )

export type BatchFormData = z.infer<typeof batchSchema>