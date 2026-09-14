import { useEffect, useRef } from 'react'

type ConfirmResetDialogProps = {
  open: boolean
  count: number
  comboSize: number
  combos: number
  onCancel: () => void
  onConfirm: () => void
}

/** Anel partido ao meio por uma rachadura: o que o "zerar" faz com o contador. */
function CrackIcon() {
  return (
    <svg className="crack" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="crack__ring" cx="32" cy="32" r="25" strokeDasharray="2.5 5.5" />
      <path className="crack__branch" d="M26.5 19 L15 14 M36 27.5 L48 23 M27.5 37 L16 43 M35 46 L47 51" />
      <path className="crack__main" d="M32 5 L26.5 19 L36 27.5 L27.5 37 L35 46 L29.5 59" />
    </svg>
  )
}

export function ConfirmResetDialog({
  open,
  count,
  comboSize,
  combos,
  onCancel,
  onConfirm,
}: ConfirmResetDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog className="dialog dialog--danger" ref={ref} onCancel={onCancel} onClose={onCancel}>
      <div className="dialog__body">
        <div className="dialog__icon">
          <CrackIcon />
        </div>

        <h2 className="dialog__title dialog__title--danger">Zerar tudo?</h2>
        <p className="dialog__hint">
          A contagem atual e todos os combos fechados desta chave serão apagados.
        </p>

        <div className="facts">
          <div className="fact">
            <span className="fact__value">
              {count}
              <span className="fact__unit">/{comboSize}</span>
            </span>
            <span className="fact__label">Contagem atual</span>
          </div>
          <div className="fact">
            <span className="fact__value">{combos}</span>
            <span className="fact__label">Combos fechados</span>
          </div>
        </div>

        <div className="dialog__actions">
          <button className="dialog__cancel" type="button" onClick={onCancel} autoFocus>
            Cancelar
          </button>
          <button className="danger-btn" type="button" onClick={onConfirm}>
            Zerar tudo
          </button>
        </div>
      </div>
    </dialog>
  )
}
