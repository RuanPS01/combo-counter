import { normalizeAccessKey } from './hash'

/** Identificacao do contador aberto: hash da chave + rotulo mascarado. */
export type Session = { id: string; label: string }

/** Mostra a chave sem revela-la: `equipe-a` vira `eq••••••`. */
export function maskKey(key: string): string {
  const normalized = normalizeAccessKey(key)
  const visible = normalized.slice(0, 2)
  return visible + '•'.repeat(Math.min(Math.max(normalized.length - 2, 1), 10))
}
