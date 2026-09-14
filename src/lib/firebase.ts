import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

const env = import.meta.env

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/**
 * Sem as variaveis de ambiente o app roda 100% offline (localStorage).
 * Nenhum byte do SDK do Firebase e carregado nesse caso: os imports sao
 * dinamicos e so acontecem quando ha configuracao valida.
 */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

export const COLLECTION = env.VITE_FIREBASE_COLLECTION || 'counters'

let dbPromise: Promise<Firestore> | null = null

export function getDb(): Promise<Firestore> {
  if (!isFirebaseConfigured) return Promise.reject(new Error('Firebase nao configurado'))
  dbPromise ??= bootstrap()
  return dbPromise
}

async function bootstrap(): Promise<Firestore> {
  const [{ initializeApp, getApps, getApp }, { getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore'),
  ])
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config)
  await maybeSignInAnonymously(app)
  return getFirestore(app)
}

/**
 * Regras do Firestore normalmente exigem `request.auth != null`. Tentamos login
 * anonimo por padrao; se o provedor nao estiver habilitado seguimos assim mesmo
 * (as regras de exemplo do repositorio funcionam sem autenticacao).
 */
async function maybeSignInAnonymously(app: FirebaseApp): Promise<void> {
  if (env.VITE_FIREBASE_ANONYMOUS_AUTH === 'false') return
  try {
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import('firebase/auth')
    const auth = getAuth(app)
    if (auth.currentUser) return
    await signInAnonymously(auth)
    await new Promise<void>((resolve) => {
      const stop = onAuthStateChanged(auth, (user) => {
        if (!user) return
        stop()
        resolve()
      })
    })
  } catch (error) {
    console.warn('[combo-counter] login anonimo indisponivel, seguindo sem autenticacao', error)
  }
}
