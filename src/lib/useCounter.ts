import { useCallback, useEffect, useRef, useState } from 'react'
import { isFirebaseConfigured } from './firebase'
import { subscribeRemote, syncWithRemote } from './remote'
import { isDirty, loadLocalState, saveLocalState, setDirty } from './storage'
import {
  MAX_COMBO_SIZE,
  MIN_COMBO_SIZE,
  clamp,
  createCounterState,
  normalizeOverflow,
  pickNewest,
  sameState,
  type CounterState,
  type SyncStatus,
} from './types'

const FLUSH_DEBOUNCE_MS = 700
const RETRY_MS = 15_000
const COALESCE_MS = 250
const UNDO_DEPTH = 25

export type CounterApi = {
  state: CounterState
  status: SyncStatus
  canUndo: boolean
  /** Retorna true quando o toque fechou um combo. */
  increment: () => boolean
  undo: () => void
  reset: () => void
  setComboSize: (size: number) => void
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isOnline(): boolean {
  return globalThis.navigator?.onLine ?? true
}

/**
 * `id` precisa ser estavel: a tela e remontada (via `key`) ao trocar de chave.
 *
 * Fonte da verdade e sempre o localStorage: toda alteracao e gravada
 * localmente e refletida na tela na hora. O Firestore entra como replica
 * eventual — quando ha rede, a versao com `updatedAt` mais recente vence.
 */
export function useCounter(id: string | null): CounterApi {
  const [state, setState] = useState<CounterState>(
    () => (id && loadLocalState(id)) || createCounterState(),
  )
  const [status, setStatus] = useState<SyncStatus>(
    isFirebaseConfigured ? (isOnline() ? 'syncing' : 'offline') : 'local-only',
  )
  const [canUndo, setCanUndo] = useState(false)

  const stateRef = useRef(state)
  const undoStack = useRef<CounterState[]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushing = useRef(false)
  const flushAgain = useRef(false)

  const adopt = useCallback(
    (next: CounterState, dirty: boolean) => {
      stateRef.current = next
      setState(next)
      if (!id) return
      saveLocalState(id, next)
      setDirty(id, dirty)
    },
    [id],
  )

  const flush = useCallback(async () => {
    if (!id || !isFirebaseConfigured) return
    if (flushing.current) {
      // Ja existe um envio em andamento: ele repete o ciclo ao terminar.
      flushAgain.current = true
      return
    }
    flushing.current = true
    try {
      do {
        flushAgain.current = false
        if (!isOnline()) {
          setStatus('offline')
          break
        }
        const pushed = stateRef.current
        setStatus('syncing')
        try {
          const winner = await syncWithRemote(id, pushed)
          const merged = pickNewest(stateRef.current, winner)
          if (!sameState(merged, stateRef.current)) {
            // O servidor tinha algo mais novo (outro aparelho contou antes).
            adopt(merged, false)
            setStatus('synced')
          } else if (sameState(pushed, stateRef.current)) {
            setDirty(id, false)
            setStatus('synced')
          } else {
            // Houve toque durante o envio: roda mais um ciclo com o valor novo.
            flushAgain.current = true
            setStatus('pending')
          }
        } catch (error) {
          console.warn('[combo-counter] falha ao sincronizar, dados seguem salvos localmente', error)
          setStatus(isOnline() ? 'error' : 'offline')
          break
        }
        if (flushAgain.current) await delay(COALESCE_MS)
      } while (flushAgain.current)
    } finally {
      flushing.current = false
    }
  }, [adopt, id])

  const scheduleFlush = useCallback(
    (delayMs = FLUSH_DEBOUNCE_MS) => {
      if (!isFirebaseConfigured || !id) return
      if (flushTimer.current) clearTimeout(flushTimer.current)
      flushTimer.current = setTimeout(() => {
        flushTimer.current = null
        void flush()
      }, delayMs)
    },
    [flush, id],
  )

  /** Grava localmente na hora e agenda o envio. */
  const commit = useCallback(
    (next: CounterState, options: { undoable?: boolean } = {}) => {
      if (options.undoable !== false) {
        undoStack.current = [...undoStack.current, stateRef.current].slice(-UNDO_DEPTH)
        setCanUndo(true)
      }
      adopt(next, true)
      if (isFirebaseConfigured) setStatus(isOnline() ? 'pending' : 'offline')
      scheduleFlush()
    },
    [adopt, scheduleFlush],
  )

  const increment = useCallback((): boolean => {
    const current = stateRef.current
    const next = current.count + 1
    const completed = next >= current.comboSize
    commit({
      ...current,
      count: completed ? 0 : next,
      combos: completed ? current.combos + 1 : current.combos,
      total: current.total + 1,
      updatedAt: Date.now(),
    })
    return completed
  }, [commit])

  const undo = useCallback(() => {
    const previous = undoStack.current.at(-1)
    if (!previous) return
    undoStack.current = undoStack.current.slice(0, -1)
    setCanUndo(undoStack.current.length > 0)
    commit({ ...previous, updatedAt: Date.now() }, { undoable: false })
  }, [commit])

  const reset = useCallback(() => {
    commit({ ...stateRef.current, count: 0, combos: 0, total: 0, updatedAt: Date.now() })
  }, [commit])

  const setComboSize = useCallback(
    (size: number) => {
      const comboSize = clamp(Math.trunc(size) || MIN_COMBO_SIZE, MIN_COMBO_SIZE, MAX_COMBO_SIZE)
      const current = stateRef.current
      if (comboSize === current.comboSize) return
      // Diminuir o combo pode deixar o progresso atual maior que o novo alvo:
      // o excedente vira combo(s) fechado(s) em vez de ser descartado.
      commit(normalizeOverflow({ ...current, comboSize, updatedAt: Date.now() }))
    },
    [commit],
  )

  // Escuta o documento remoto e reage a volta da conexao.
  useEffect(() => {
    if (!id || !isFirebaseConfigured) return
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    void subscribeRemote(
      id,
      (remote) => {
        const merged = pickNewest(stateRef.current, remote)
        if (!sameState(merged, stateRef.current)) {
          adopt(merged, false)
          setStatus('synced')
        } else if (isDirty(id)) {
          scheduleFlush(0)
        } else {
          setStatus('synced')
        }
      },
      (error) => {
        console.warn('[combo-counter] assinatura remota interrompida', error)
        setStatus(isOnline() ? 'error' : 'offline')
      },
    ).then((stop) => {
      if (cancelled) stop()
      else unsubscribe = stop
    })

    scheduleFlush(0)

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [adopt, id, scheduleFlush])

  useEffect(() => {
    if (!id || !isFirebaseConfigured) return
    const onOnline = () => scheduleFlush(0)
    const onOffline = () => setStatus('offline')
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isDirty(id)) scheduleFlush(0)
    }
    const retry = setInterval(() => {
      if (isOnline() && isDirty(id)) scheduleFlush(0)
    }, RETRY_MS)

    globalThis.addEventListener('online', onOnline)
    globalThis.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(retry)
      globalThis.removeEventListener('online', onOnline)
      globalThis.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id, scheduleFlush])

  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current)
    },
    [],
  )

  return { state, status, canUndo, increment, undo, reset, setComboSize }
}
