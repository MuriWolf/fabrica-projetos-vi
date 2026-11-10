import { z } from 'zod'

export const movementSchema = z.object({
  batchId: z.string().min(1, 'Selecione um lote'),

  type: z.enum(['Entry', 'Exit'], {
    message: 'Selecione o tipo de movimentação'
  }),

  quantity: z.coerce
    .number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que 0')
})

export type MovementFormData = z.infer<typeof movementSchema>
