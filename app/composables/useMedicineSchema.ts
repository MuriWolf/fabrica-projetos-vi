import { z } from 'zod'

export const medicineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Máximo de 100 caracteres'),

  activeIngredient: z
    .string()
    .trim()
    .min(1, 'Princípio ativo é obrigatório')
    .max(100, 'Máximo de 100 caracteres'),

  dosage: z
    .string()
    .trim()
    .min(1, 'Dosagem é obrigatória')
    .max(50, 'Máximo de 50 caracteres'),

  unit: z
    .string()
    .trim()
    .min(1, 'Unidade é obrigatória')
    .max(50, 'Máximo de 50 caracteres')
})

export type MedicineFormData = z.infer<typeof medicineSchema>
