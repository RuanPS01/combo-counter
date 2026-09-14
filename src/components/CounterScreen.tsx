import { useEffect, useRef, useState } from 'react'
import { useCounter } from '../lib/useCounter'
import { ComboRing } from './ComboRing'
import { ComboSizeDialog } from './ComboSizeDialog'
import { SyncBadge } from './SyncBadge'
import type { Session } from '../lib/session'

const COMPLETE_FLASH_MS = 750

export function CounterScreen({ session, onExit }: { session: Session; onExit: () => void }) {
  const { state, status, canUndo, increment, undo, reset, setComboSize } = useCounter(session.id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [complete, setComplete] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  function handleCount() {
    const closedCombo = increment()
    globalThis.navigator?.vibrate?.(closedCombo ? [18, 45, 18] : 10)
    if (!closedCombo) return
    // O estado ja voltou para zero; a animacao mostra o anel cheio por um instante.
    setComplete(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setComplete(false), COMPLETE_FLASH_MS)
  }

  function handleReset() {
    const confirmed = globalThis.confirm('Zerar este contador? Os combos fechados serão perdidos.')
    if (confirmed) reset()
  }

  const shown = complete ? state.comboSize : state.count

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand__mark" />
          <span>
            <span className="brand__name">Combo</span>
            <span className="brand__key"> {session.label}</span>
          </span>
        </div>
        <div className="header__actions">
          <SyncBadge status={status} />
          <button
            className="chip"
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={`Tamanho do combo: ${state.comboSize}. Toque para alterar.`}
          >
            Combo <span className="chip__value">{state.comboSize}</span>
          </button>
          <button className="icon-btn" type="button" onClick={onExit} aria-label="Trocar de chave">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="stack-center">
        <div className={complete ? 'ring ring--complete' : 'ring'}>
          <ComboRing size={state.comboSize} value={state.count} complete={complete} />
          <div className="ring__center">
            <span className="ring__count">{shown}</span>
            <span className="ring__of">/ {state.comboSize}</span>
            <span className="ring__label">{complete ? 'Combo!' : ''}</span>
          </div>
        </div>

        <div className="stats">
          <div className="stat stat--alt">
            <div className="stat__value">{state.combos}</div>
            <div className="stat__label">Combos</div>
          </div>
          <div className="stat">
            <div className="stat__value">{state.total}</div>
            <div className="stat__label">Total</div>
          </div>
        </div>

        <button className="count-btn" type="button" onClick={handleCount} data-complete={complete}>
          Contar
        </button>

        <div className="secondary-row">
          <button className="ghost-btn" type="button" onClick={undo} disabled={!canUndo}>
            Desfazer
          </button>
          <button className="ghost-btn ghost-btn--danger" type="button" onClick={handleReset}>
            Zerar
          </button>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {state.count} de {state.comboSize} no combo atual, {state.combos} combos fechados.
        </p>
      </main>

      <ComboSizeDialog
        open={settingsOpen}
        value={state.comboSize}
        onClose={() => setSettingsOpen(false)}
        onSave={setComboSize}
      />
    </div>
  )
}
