import type { SyncStatus } from '../lib/types'

const LABELS: Record<SyncStatus, string> = {
  'local-only': 'Local',
  offline: 'Offline',
  pending: 'Pendente',
  syncing: 'Sincronizando',
  synced: 'Sincronizado',
  error: 'Sem conexão',
}

const TITLES: Record<SyncStatus, string> = {
  'local-only': 'Firebase não configurado — os dados ficam salvos neste dispositivo.',
  offline: 'Sem internet. As contagens continuam salvas e serão enviadas ao reconectar.',
  pending: 'Alterações salvas localmente, aguardando envio.',
  syncing: 'Enviando alterações para a nuvem.',
  synced: 'Tudo sincronizado com a nuvem.',
  error: 'Não foi possível falar com a nuvem. Os dados seguem salvos aqui.',
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  return (
    <span className="sync" data-status={status} title={TITLES[status]}>
      <span className="sync__dot" />
      {LABELS[status]}
    </span>
  )
}
