import { useState, type FormEvent } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { hashAccessKey, normalizeAccessKey } from '../lib/hash'
import { maskKey, type Session } from '../lib/session'

const MIN_KEY_LENGTH = 3

export function AccessKeyGate({ onUnlock }: { onUnlock: (session: Session, remember: boolean) => void }) {
  const [key, setKey] = useState('')
  const [reveal, setReveal] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeAccessKey(key)
    if (normalized.length < MIN_KEY_LENGTH) {
      setError(`A chave precisa ter pelo menos ${MIN_KEY_LENGTH} caracteres.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const id = await hashAccessKey(normalized)
      onUnlock({ id, label: maskKey(normalized) }, remember)
    } catch {
      setError('Não foi possível abrir o contador. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <form className="gate" onSubmit={handleSubmit}>
      <h1 className="gate__title">Combo Counter</h1>
      <p className="gate__subtitle">Informe a chave de acesso do contador</p>

      <label className="field">
        <span className="field__label">Chave de acesso</span>
        <span className="field__box">
          <input
            className="field__input"
            type={reveal ? 'text' : 'password'}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="••••••••"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            autoFocus
          />
          <button
            className="field__toggle"
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? 'Ocultar chave' : 'Mostrar chave'}
          >
            {reveal ? 'Ocultar' : 'Ver'}
          </button>
        </span>
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        Lembrar neste dispositivo
      </label>

      {error && <p className="gate__error">{error}</p>}

      <button className="primary-btn" type="submit" disabled={busy}>
        {busy ? 'Abrindo...' : 'Entrar'}
      </button>

      <p className="gate__mode">
        {isFirebaseConfigured ? (
          <>
            <strong>Nuvem ativa.</strong> Cada chave abre o mesmo contador em qualquer aparelho. Sem
            internet tudo continua funcionando e sincroniza depois.
          </>
        ) : (
          <>
            <strong>Modo local.</strong> O Firebase não está configurado, então o contador vive
            apenas neste dispositivo.
          </>
        )}
      </p>
    </form>
  )
}
