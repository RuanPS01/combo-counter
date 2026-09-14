import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MAX_COMBO_SIZE, MIN_COMBO_SIZE, clamp } from '../lib/types'

const PRESETS = [10, 12, 20, 30, 50, 100]

type ComboSizeDialogProps = {
  open: boolean
  value: number
  onClose: () => void
  onSave: (size: number) => void
}

export function ComboSizeDialog({ open, value, onClose, onSave }: ComboSizeDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setDraft(String(value))
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, value])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) return
    onSave(clamp(parsed, MIN_COMBO_SIZE, MAX_COMBO_SIZE))
    onClose()
  }

  return (
    <dialog className="dialog" ref={ref} onCancel={onClose} onClose={onClose}>
      <form className="dialog__body" onSubmit={handleSubmit}>
        <h2 className="dialog__title">Tamanho do combo</h2>
        <p className="dialog__hint">
          Quantas unidades fecham um combo. Se o novo valor for menor que o progresso atual, o
          excedente vira combo fechado.
        </p>

        <div className="presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="preset"
              aria-pressed={Number(draft) === preset}
              onClick={() => setDraft(String(preset))}
            >
              {preset}
            </button>
          ))}
        </div>

        <label className="field">
          <span className="field__label">Personalizado ({MIN_COMBO_SIZE}–{MAX_COMBO_SIZE})</span>
          <span className="field__box">
            <input
              className="field__input"
              type="number"
              inputMode="numeric"
              min={MIN_COMBO_SIZE}
              max={MAX_COMBO_SIZE}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </span>
        </label>

        <div className="dialog__actions">
          <button className="dialog__cancel" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-btn" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </dialog>
  )
}
