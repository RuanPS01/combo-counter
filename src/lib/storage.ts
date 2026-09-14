import { sanitizeState, type CounterState } from './types'

const STATE_PREFIX = 'combo-counter:state:'
const DIRTY_PREFIX = 'combo-counter:dirty:'
const SESSION_KEY = 'combo-counter:session'

type StoredSession = { id: string; label: string }

function safeGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Modo privativo / storage cheio: seguimos apenas em memoria.
  }
}

function safeRemove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key)
  } catch {
    // ignore
  }
}

export function loadLocalState(id: string): CounterState | null {
  const raw = safeGet(STATE_PREFIX + id)
  if (!raw) return null
  try {
    return sanitizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveLocalState(id: string, state: CounterState): void {
  safeSet(STATE_PREFIX + id, JSON.stringify(state))
}

/** Marca que o estado local ainda nao foi confirmado pelo servidor. */
export function setDirty(id: string, dirty: boolean): void {
  if (dirty) safeSet(DIRTY_PREFIX + id, '1')
  else safeRemove(DIRTY_PREFIX + id)
}

export function isDirty(id: string): boolean {
  return safeGet(DIRTY_PREFIX + id) === '1'
}

export function loadSession(): StoredSession | null {
  const raw = safeGet(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { id, label } = parsed as Record<string, unknown>
    if (typeof id !== 'string' || id.length === 0) return null
    return { id, label: typeof label === 'string' ? label : '' }
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  safeSet(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  safeRemove(SESSION_KEY)
}
