/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** Colecao do Firestore usada pelos contadores (padrao: `counters`). */
  readonly VITE_FIREBASE_COLLECTION?: string
  /** `false` desliga o login anonimo automatico. */
  readonly VITE_FIREBASE_ANONYMOUS_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
