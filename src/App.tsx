import { useState } from 'react'
import { AccessKeyGate } from './components/AccessKeyGate'
import { CounterScreen } from './components/CounterScreen'
import { clearSession, loadSession, saveSession } from './lib/storage'
import type { Session } from './lib/session'

export default function App() {
  // Guardamos apenas o hash da chave e um rotulo mascarado — a chave em si
  // nunca e persistida nem enviada para lugar nenhum.
  const [session, setSession] = useState<Session | null>(() => loadSession())

  function handleUnlock(next: Session, remember: boolean) {
    if (remember) saveSession(next)
    else clearSession()
    setSession(next)
  }

  function handleExit() {
    clearSession()
    setSession(null)
  }

  return (
    <>
      <div className="backdrop">
        <div className="aurora aurora--cyan" />
        <div className="aurora aurora--magenta" />
      </div>
      {session ? (
        // `key` remonta a tela ao trocar de chave, zerando o estado do contador.
        <CounterScreen key={session.id} session={session} onExit={handleExit} />
      ) : (
        <div className="app">
          <div className="app__shell">
            <main className="stack-center">
              <AccessKeyGate onUnlock={handleUnlock} />
            </main>
          </div>
        </div>
      )}
    </>
  )
}
