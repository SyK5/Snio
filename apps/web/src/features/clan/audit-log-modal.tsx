import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { PagedModal } from '@/components/ui/paged-modal'
import { getLocale } from '@/i18n/paraglide/runtime'
import { m } from '@/i18n/paraglide/messages'
import { useAuditLog } from './audit.hooks'
import { auditActorLabel, auditText } from './audit-text'
import type { AuditLogView } from './clan.types'

interface Props {
  clanId: string
  open: boolean
  onClose: () => void
}

export function AuditLogModal({ clanId, open, onClose }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useAuditLog(clanId, open)
  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <PagedModal open={open} onClose={onClose} icon={faClockRotateLeft} title={m.audit_title()} subtitle={m.audit_subtitle()} size="lg" bodyClassName="p-0">
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading && <p className="px-6 py-10 text-center text-sm text-muted-foreground">{m.clan_loading()}</p>}
        {!isLoading && items.length === 0 && <p className="px-6 py-16 text-center text-sm text-muted-foreground">{m.audit_empty()}</p>}
        {items.length > 0 && (
          <div className="divide-y divide-border">
            {items.map(e => (
              <AuditRow key={e.id} entry={e} />
            ))}
          </div>
        )}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full cursor-pointer px-6 py-3 text-center text-xs text-muted-foreground transition hover:text-foreground"
          >
            {m.audit_load_more()}
          </button>
        )}
      </div>
    </PagedModal>
  )
}

function AuditRow({ entry }: { entry: AuditLogView }) {
  return (
    <div className="flex flex-col gap-1 px-6 py-3">
      <span className="text-sm text-foreground">
        <span className="font-semibold">{auditActorLabel(entry)}</span> {auditText(entry)}
      </span>
      <span className="text-xs text-muted-foreground">{formatTime(entry.createdAt)}</span>
    </div>
  )
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}
