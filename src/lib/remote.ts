import { COLLECTION, getDb } from './firebase'
import { pickNewest, sanitizeState, type CounterState } from './types'

/**
 * Envia o estado local para o Firestore resolvendo conflitos por
 * "o mais recente vence". A transacao le a versao do servidor dentro da mesma
 * operacao, entao se outro dispositivo gravou algo mais novo enquanto estavamos
 * offline, esse valor e preservado e devolvido para o chamador.
 */
export async function syncWithRemote(id: string, local: CounterState): Promise<CounterState> {
  const db = await getDb()
  const { doc, runTransaction } = await import('firebase/firestore')
  const ref = doc(db, COLLECTION, id)

  let winner = local
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref)
    const remote = snapshot.exists() ? sanitizeState(snapshot.data()) : null
    winner = remote ? pickNewest(local, remote) : local
    // `updatedAt === 0` significa "nada foi contado ainda": nesse caso apenas
    // lemos o servidor, sem criar documentos vazios para cada chave digitada.
    if (winner === local && local.updatedAt > 0) tx.set(ref, { ...local })
  })
  return winner
}

/** Observa o documento remoto para refletir contagens feitas em outros aparelhos. */
export async function subscribeRemote(
  id: string,
  onState: (state: CounterState) => void,
  onError: (error: unknown) => void,
): Promise<() => void> {
  const db = await getDb()
  const { doc, onSnapshot } = await import('firebase/firestore')
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snapshot) => {
      if (!snapshot.exists()) return
      const state = sanitizeState(snapshot.data())
      if (state) onState(state)
    },
    onError,
  )
}
