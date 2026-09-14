import { useEffect, useRef, useState } from 'react'
import { useCounter } from '../lib/useCounter'
import { ComboBurst } from './ComboBurst'
import { ComboRing } from './ComboRing'
import { ComboSizeDialog } from './ComboSizeDialog'
import { ConfirmResetDialog } from './ConfirmResetDialog'
import { SyncBadge } from './SyncBadge'
import type { Session } from '../lib/session'

/** Quanto tempo o anel fica aceso por inteiro celebrando o combo fechado. */
const COMBO_FLASH_MS = 1100

export function CounterScreen({ session, onExit }: { session: Session; onExit: () => void }) {
  const { state, status, canUndo, increment, undo, reset, setComboSize } = useCounter(session.id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [complete, setComplete] = useState(false)
  // Contadores so para dar `key` nova as animacoes: trocar a key remonta o
  // elemento e faz o CSS rodar de novo, mesmo em toques colados.
  const [tick, setTick] = useState(0)
  const [comboTick, setComboTick] = useState(0)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  function handleCount() {
    const closedCombo = increment()
    setTick((value) => value + 1)
    globalThis.navigator?.vibrate?.(closedCombo ? [25, 35, 25, 35, 70] : 10)
    if (!closedCombo) return
    // O estado ja voltou para zero; a animacao mostra o anel cheio por um instante.
    setComboTick((value) => value + 1)
    setComplete(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setComplete(false), COMBO_FLASH_MS)
  }

  function handleReset() {
    reset()
    setResetOpen(false)
  }

  const shown = complete ? state.comboSize : state.count

  return (
    <div className="app" data-combo={complete}>
      <div className="app__shell">
        {complete && <div className="screen-flash" key={`flash-${comboTick}`} />}

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
            {tick > 0 && <span className="ring__ripple" key={`ripple-${tick}`} />}
            {complete && <ComboBurst key={`burst-${comboTick}`} />}

            <div className="ring__center">
              <span
                className={tick > 0 ? 'ring__count ring__count--pop' : 'ring__count'}
                key={`count-${tick}`}
              >
                {shown}
              </span>
              {tick > 0 && (
                <span className="ring__plus" key={`plus-${tick}`}>
                  +1
                </span>
              )}
              <span className="ring__of">/ {state.comboSize}</span>
              <span className="ring__label" key={`label-${comboTick}`}>
                {complete ? `Combo ${state.combos}!` : ''}
              </span>
            </div>
          </div>

          <div className="stats">
            <div className="stat stat--alt">
              <div className="stat__value" key={`combos-${state.combos}`}>
                {state.combos}
              </div>
              <div className="stat__label">Combos</div>
            </div>
            <div className="stat">
              <div className="stat__value" key={`total-${state.total}`}>
                {state.total}
              </div>
              <div className="stat__label">Total</div>
            </div>
          </div>

          <button className="count-btn" type="button" onClick={handleCount} data-complete={complete}>
            {tick > 0 && <span className="count-btn__wave" key={`wave-${tick}`} />}
            <span className="count-btn__text">Contar</span>
          </button>

          <div className="secondary-row">
            <button className="ghost-btn" type="button" onClick={undo} disabled={!canUndo}>
              Desfazer
            </button>
            <button
              className="ghost-btn ghost-btn--danger"
              type="button"
              onClick={() => setResetOpen(true)}
            >
              Zerar
            </button>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {state.count} de {state.comboSize} no combo atual, {state.combos} combos fechados.
          </p>
        </main>
      </div>

      <ComboSizeDialog
        open={settingsOpen}
        value={state.comboSize}
        onClose={() => setSettingsOpen(false)}
        onSave={setComboSize}
      />

      <ConfirmResetDialog
        open={resetOpen}
        count={state.count}
        comboSize={state.comboSize}
        combos={state.combos}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  )
}
