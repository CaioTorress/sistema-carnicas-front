export function formatCpfCnpj(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return '—'
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function daysRemainingColor(days: number | null): string {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-700 font-semibold'
  if (days <= 7) return 'text-red-600 font-semibold'
  if (days <= 30) return 'text-yellow-600 font-semibold'
  return 'text-green-600'
}

/**
 * Dias até a data de vencimento (somente calendário).
 * 0 = vence hoje; positivo = dias restantes; negativo = já vencido (dias desde o vencimento).
 */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const exp = new Date(expiresAt)
  if (Number.isNaN(exp.getTime())) return null

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate())

  const diffMs = expDay.getTime() - startOfToday.getTime()
  return Math.round(diffMs / 86_400_000)
}

/** Prioriza cálculo a partir de `expires_at`; se não houver, usa o valor da API. */
export function resolveDaysUntilExpiry(
  expiresAt: string | null,
  daysRemainingFromApi: number | null,
): number | null {
  const fromDate = daysUntilExpiry(expiresAt)
  if (fromDate !== null) return fromDate
  return daysRemainingFromApi
}

export function formatDaysUntilExpiryLabel(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'Hoje'
  if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  const n = Math.abs(days)
  return `Vencido há ${n} ${n === 1 ? 'dia' : 'dias'}`
}

/** Considera apenas a data (sem hora). Inclui vencimento hoje até `maxDaysInclusive` dias à frente. */
export function isExpiringWithinDays(expiresAt: string | null, maxDaysInclusive: number): boolean {
  const d = daysUntilExpiry(expiresAt)
  if (d === null) return false
  return d >= 0 && d <= maxDaysInclusive
}

export function applyCpfCnpjMask(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function applyCurrencyMask(value: string): string {
  const digits = value.replace(/\D/g, '')
  const number = parseInt(digits || '0', 10) / 100
  return formatCurrency(number)
}

export function parseCurrencyToNumber(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
