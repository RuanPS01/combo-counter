export const DEFAULT_COMBO_SIZE = 30
export const MIN_COMBO_SIZE = 2
export const MAX_COMBO_SIZE = 200

/**
 * Estado de um contador. `count` e o progresso dentro do combo atual
 * (0 .. comboSize - 1) e `combos` e a quantidade de combos ja fechados.
 * `total` guarda quantas unidades foram contadas no total — e um numero
 * proprio, e nao `combos * comboSize + count`, para que mudar o tamanho do
 * combo no meio do caminho nao reescreva o historico.
 * `updatedAt` (epoch ms) e o criterio de "o mais recente vence" usado na
 * reconciliacao entre o armazenamento local e o Firestore.
 */
export type CounterState = {
  count: number
  combos: number
  comboSize: number
  total: number
  updatedAt: number
}

export type SyncStatus =
  | 'local-only' // Firebase nao configurado: tudo vive no dispositivo
  | 'offline' // Configurado, mas sem rede no momento
  | 'pending' // Ha alteracoes locais aguardando envio
  | 'syncing'
  | 'synced'
  | 'error'

export function createCounterState(comboSize = DEFAULT_COMBO_SIZE): CounterState {
  return { count: 0, combos: 0, comboSize, total: 0, updatedAt: 0 }
}

/** Normaliza dados vindos de qualquer fonte (localStorage ou Firestore). */
export function sanitizeState(raw: unknown): CounterState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const data = raw as Record<string, unknown>
  const comboSize = clamp(toInt(data.comboSize, DEFAULT_COMBO_SIZE), MIN_COMBO_SIZE, MAX_COMBO_SIZE)
  const count = Math.max(0, toInt(data.count, 0))
  const combos = Math.max(0, toInt(data.combos, 0))
  const state: CounterState = {
    comboSize,
    count,
    combos,
    total: Math.max(0, toInt(data.total, combos * comboSize + count)),
    updatedAt: Math.max(0, toInt(data.updatedAt, 0)),
  }
  return normalizeOverflow(state)
}

/** Redistribui o progresso quando `count` excede o tamanho do combo. */
export function normalizeOverflow(state: CounterState): CounterState {
  if (state.count < state.comboSize) return state
  const extraCombos = Math.floor(state.count / state.comboSize)
  return {
    ...state,
    combos: state.combos + extraCombos,
    count: state.count % state.comboSize,
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

/**
 * Decide qual das duas versoes prevalece. Vence o `updatedAt` mais recente;
 * em empate vence quem contou mais (evita perder toques em relogios iguais).
 */
export function pickNewest(a: CounterState, b: CounterState): CounterState {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b
  return a.total >= b.total ? a : b
}

export function sameState(a: CounterState, b: CounterState): boolean {
  return (
    a.count === b.count &&
    a.combos === b.combos &&
    a.comboSize === b.comboSize &&
    a.total === b.total &&
    a.updatedAt === b.updatedAt
  )
}
