const CPF_LENGTH = 11

/** Keep only the digits of a CPF value. */
export function onlyDigits(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '')
}

/** Format a CPF as 000.000.000-00. Partial values are formatted as they grow. */
export function formatCpf(value?: string | null): string {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function checkDigit(base: string, factor: number): number {
  let sum = 0

  for (let index = 0; index < base.length; index++) {
    sum += Number(base[index]) * (factor - index)
  }

  const remainder = (sum * 10) % 11

  return remainder === 10 ? 0 : remainder
}

/** Validate a CPF using its two check digits. */
export function isValidCpf(value?: string | null): boolean {
  const digits = onlyDigits(value)

  if (digits.length !== CPF_LENGTH) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const firstDigit = checkDigit(digits.slice(0, 9), 10)
  const secondDigit = checkDigit(digits.slice(0, 10), 11)

  return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10])
}
