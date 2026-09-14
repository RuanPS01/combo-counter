# Combo Counter

PWA de contagem de combos com interface neon. Página única: um número no centro,
um círculo pontilhado ao redor onde cada ponto aceso é uma unidade contada, e um
botão **Contar** que incrementa. Ao completar o combo (30 por padrão), o último
ponto acende, o anel pisca inteiro e o contador passa para o próximo combo.

Cada contador é identificado por uma **chave de acesso**: é ela que decide qual
contador você abre.

## Stack

- Vite + React + TypeScript
- PWA instalável e offline (`vite-plugin-pwa` / Workbox)
- Firebase Firestore **opcional** — sem configuração o app funciona 100% local
- Deploy automático no GitHub Pages via GitHub Actions

## Rodando localmente

```bash
npm install
npm run dev
```

Para simular o build de produção:

```bash
npm run build && npm run preview
```

## Chave de acesso

A chave funciona como uma senha que identifica o contador. Ela **nunca é
enviada nem armazenada**: o que vai para o Firestore é o `SHA-256` da chave,
usado como id do documento. No dispositivo guardamos apenas esse hash e um
rótulo mascarado (`eq••••••`) para exibir no cabeçalho.

Quem souber a chave abre o mesmo contador em qualquer aparelho. Quem tiver
acesso ao banco vê apenas ids opacos.

## Firebase (opcional)

1. Crie um projeto no [Firebase](https://console.firebase.google.com/) e ative o
   **Firestore**.
2. Em _Authentication → Sign-in method_, habilite **Anônimo** (o app faz login
   anônimo automático; as regras de exemplo exigem isso).
3. Copie `.env.example` para `.env.local` e preencha com os dados do app web.
4. Publique as regras do arquivo [`firestore.rules`](firestore.rules).

Sem essas variáveis, `isFirebaseConfigured` fica `false`, o SDK **nem é
baixado** e o app roda apenas com `localStorage`.

### Como funciona a sincronização

O armazenamento local é sempre a fonte da verdade:

1. Todo toque grava no `localStorage` e atualiza a tela na hora — sem esperar rede.
2. O envio para o Firestore é agendado (debounce de ~700 ms) e feito dentro de
   uma **transação**: o servidor é lido e gravado no mesmo passo.
3. O conflito é resolvido por **_last write wins_** usando `updatedAt`; em empate
   de timestamp vence quem contou mais, para não perder toques.
4. Sem internet nada é perdido: o estado fica marcado como pendente e é
   reenviado quando a conexão volta (eventos `online`, retorno à aba e um retry
   a cada 15 s).
5. Um `onSnapshot` mantém a tela viva quando outro aparelho conta na mesma chave.

O indicador no cabeçalho mostra o estado atual: `Local`, `Offline`, `Pendente`,
`Sincronizando`, `Sincronizado` ou `Sem conexão`.

## Deploy no GitHub Pages

O workflow [`deploy.yml`](.github/workflows/deploy.yml) faz lint, build e publica
a cada push na `main`. Em pull requests ele apenas valida, sem publicar.

Para ativar:

1. _Settings → Pages → Source_: selecione **GitHub Actions**.
2. (Opcional) _Settings → Secrets and variables → Actions_ → **Secrets**, adicione
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` e
   `VITE_FIREBASE_APP_ID`. Sem eles a publicação sai em modo local.

O base path (`/combo-counter/`) é derivado do nome do repositório dentro do
próprio workflow, então o app funciona tanto em site de projeto quanto em site
de usuário (`<owner>.github.io`, servido na raiz) — e os PRs são validados mesmo
antes de o Pages estar habilitado.

## Estrutura

```
src/
├─ components/
│  ├─ AccessKeyGate.tsx    # tela da chave de acesso
│  ├─ ComboRing.tsx        # círculo pontilhado em SVG
│  ├─ ComboSizeDialog.tsx  # ajuste do tamanho do combo
│  ├─ CounterScreen.tsx    # tela principal
│  └─ SyncBadge.tsx        # indicador de sincronização
├─ lib/
│  ├─ firebase.ts          # init lazy + detecção de configuração
│  ├─ hash.ts              # SHA-256 da chave de acesso
│  ├─ remote.ts            # transação e assinatura do Firestore
│  ├─ storage.ts           # localStorage (estado, pendências, sessão)
│  ├─ types.ts             # modelo do contador e regra de conflito
│  └─ useCounter.ts        # estado + motor de sincronização
└─ styles/                 # tokens, base e estilos da aplicação
```
