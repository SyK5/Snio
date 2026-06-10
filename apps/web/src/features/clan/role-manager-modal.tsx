import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGripVertical, faPlus, faShieldHalved, faTrash } from '@fortawesome/free-solid-svg-icons'
import { PagedModal } from '@/components/ui/paged-modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { useAuthStore } from '@/features/auth/auth.store'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { ColorPicker } from './color-picker'
import { GrantEditor } from './grant-editor'
import {
  useClanMembers,
  useClanRoles,
  useCreateRole,
  useDeleteRole,
  useGrantCatalog,
  useReorderRoles,
  useRoleTemplates,
  useSetRoleGrants,
  useUpdateRole,
} from './clan.hooks'
import { useDismiss } from '@/hooks/use-dismiss'
import { resolveClanError } from './clan.errors'
import type { ClanRoleDetail, ClanRoleGrantView, GrantCatalogEntry } from './clan.types'

interface Props {
  clanId: string
  isOwner: boolean
  open: boolean
  onClose: () => void
}

export function RoleManagerModal({ clanId, isOwner, open, onClose }: Props) {
  const { data: roles } = useClanRoles(clanId)
  const { data: members } = useClanMembers(clanId)
  const { data: catalog } = useGrantCatalog()
  const userId = useAuthStore(s => s.user?.id)
  const create = useCreateRole(clanId)
  const reorder = useReorderRoles(clanId)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sortableIds = useMemo(() => (roles ?? []).filter(r => r.key !== 'owner').map(r => r.id), [roles])
  const [order, setOrder] = useState<string[]>([])
  useEffect(() => {
    setOrder(sortableIds)
  }, [sortableIds.join(',')])

  const ceiling = useMemo(() => {
    if (isOwner) return Number.MAX_SAFE_INTEGER
    const mine = members?.find(mm => mm.userId === userId)
    return (mine?.roles ?? []).reduce((max, r) => (r.position > max ? r.position : max), -1)
  }, [members, userId, isOwner])

  const effective = useMemo(() => {
    if (!catalog) return {}
    if (isOwner) return Object.fromEntries(catalog.map(g => [g.key, g.actions]))
    const map: Record<string, number> = {}
    const myRoleIds = new Set(members?.find(mm => mm.userId === userId)?.roles.map(r => r.id))
    for (const role of roles ?? []) if (myRoleIds.has(role.id)) for (const g of role.grants) map[g.grant] = (map[g.grant] ?? 0) | g.actions
    return map
  }, [catalog, roles, members, userId, isOwner])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const roleById = useMemo(() => new Map((roles ?? []).map(r => [r.id, r])), [roles])
  const ownerRole = (roles ?? []).find(r => r.key === 'owner')
  const selected = selectedId ? roleById.get(selectedId) : undefined
  const canManage = (role: ClanRoleDetail) => (role.key === 'owner' ? isOwner : ceiling > role.position)

  const onPick = (template?: string) =>
    create.mutate(template ? { template } : { name: m.clan_role_new_name() }, {
      onSuccess: role => {
        setSelectedId(role.id)
        toast.success(m.clan_role_created())
      },
      onError: e => toast.error(resolveClanError(e)),
    })

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const next = arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string))
    setOrder(next)
    reorder.mutate(next, {
      onSuccess: () => toast.success(m.clan_roles_reordered()),
      onError: err => {
        toast.error(resolveClanError(err))
        setOrder(sortableIds)
      },
    })
  }

  return (
    <PagedModal open={open} onClose={onClose} icon={faShieldHalved} title={m.clan_roles_title()} subtitle={m.clan_roles_subtitle()} size="xl" bodyClassName="p-0">
      <div className="flex h-[60vh]">
        <aside className="flex w-60 shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <span className="text-sm font-semibold text-foreground">{m.clan_roles_title()}</span>
            <CreateRoleMenu onPick={onPick} />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {ownerRole && <RoleRow role={ownerRole} selected={selectedId === ownerRole.id} draggable={false} selectable onSelect={setSelectedId} />}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                {order.map(id => {
                  const role = roleById.get(id)
                  if (!role) return null
                  return <RoleRow key={id} role={role} selected={selectedId === id} draggable={canManage(role)} selectable onSelect={setSelectedId} />
                })}
              </SortableContext>
            </DndContext>
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto p-5">
          {selected && catalog ? (
            <RoleEditor
              key={selected.id}
              clanId={clanId}
              role={selected}
              catalog={catalog}
              effective={effective}
              editable={canManage(selected)}
              onDeleted={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{m.clan_role_pick()}</div>
          )}
        </section>
      </div>
    </PagedModal>
  )
}

function CreateRoleMenu({ onPick }: { onPick: (template?: string) => void }) {
  const { data: templates } = useRoleTemplates()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, open, () => setOpen(false))
  const pick = (template?: string) => {
    onPick(template)
    setOpen(false)
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={m.clan_role_new()}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xs" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          <button
            type="button"
            onClick={() => pick()}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 text-xs text-muted-foreground" />
            {m.clan_role_custom()}
          </button>
          {templates?.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => pick(t.key)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color ?? 'var(--color-muted-foreground)' }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RoleRow({
  role,
  selected,
  draggable,
  selectable,
  onSelect,
}: {
  role: ClanRoleDetail
  selected: boolean
  draggable: boolean
  selectable: boolean
  onSelect: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: role.id, disabled: !draggable })
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex items-center gap-1.5 rounded-lg px-1.5 py-2', selected ? 'bg-accent' : 'hover:bg-muted', isDragging && 'opacity-60')}
    >
      {draggable ? (
        <button {...attributes} {...listeners} aria-label="drag" className="cursor-grab px-1 text-muted-foreground">
          <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
        </button>
      ) : (
        <span className="w-5" />
      )}
      <button
        type="button"
        disabled={!selectable}
        onClick={() => onSelect(role.id)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left disabled:cursor-default"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: role.color ?? 'var(--color-muted-foreground)' }} />
        <span className="truncate text-sm text-foreground">{role.name}</span>
        {role.isSystem && <span className="ml-auto shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">{m.clan_role_system()}</span>}
      </button>
    </div>
  )
}

function RoleEditor({
  clanId,
  role,
  catalog,
  effective,
  editable,
  onDeleted,
}: {
  clanId: string
  role: ClanRoleDetail
  catalog: GrantCatalogEntry[]
  effective: Record<string, number>
  editable: boolean
  onDeleted: () => void
}) {
  const [name, setName] = useState(role.name)
  const [color, setColor] = useState(role.color)
  const [grants, setGrants] = useState<Record<string, number>>(() => Object.fromEntries(role.grants.map(g => [g.grant, g.actions])))
  const update = useUpdateRole(clanId)
  const setRoleGrants = useSetRoleGrants(clanId)
  const del = useDeleteRole(clanId)

  const isOwnerRole = role.key === 'owner'
  const nameChanged = name.trim() !== role.name
  const colorChanged = color !== role.color
  const grantsChanged = !isOwnerRole && !sameGrants(grants, role.grants)
  const dirty = nameChanged || colorChanged || grantsChanged
  const saving = update.isPending || setRoleGrants.isPending
  const ownerView = Object.fromEntries(catalog.map(g => [g.key, g.actions]))

  const save = async () => {
    try {
      if (nameChanged || colorChanged)
        await update.mutateAsync({ roleId: role.id, payload: { ...(nameChanged ? { name: name.trim() } : {}), ...(colorChanged ? { color } : {}) } })
      if (grantsChanged) await setRoleGrants.mutateAsync({ roleId: role.id, grants: toRows(grants) })
      toast.success(m.clan_role_updated())
    } catch (e) {
      toast.error(resolveClanError(e))
    }
  }

  const onDelete = () =>
    del.mutate(role.id, {
      onSuccess: () => {
        toast.success(m.clan_role_deleted())
        onDeleted()
      },
      onError: e => toast.error(resolveClanError(e)),
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <TextField label={m.clan_role_name()} value={name} disabled={!editable} maxLength={40} onChange={e => setName(e.target.value)} />
        <ColorPicker value={color} onChange={setColor} disabled={!editable} />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-foreground">{m.clan_role_grants()}</span>
        <GrantEditor
          catalog={catalog}
          value={isOwnerRole ? ownerView : grants}
          effective={effective}
          disabled={!editable || isOwnerRole}
          onToggle={(grant, actions) => setGrants(prev => ({ ...prev, [grant]: actions }))}
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        {editable && !isOwnerRole ? (
          <Button variant="danger" size="sm" onClick={onDelete} loading={del.isPending}>
            <FontAwesomeIcon icon={faTrash} className="mr-2 text-xs" />
            {m.clan_role_delete()}
          </Button>
        ) : (
          <span />
        )}
        <Button size="sm" onClick={save} loading={saving} disabled={!editable || !dirty}>
          {m.clan_role_save()}
        </Button>
      </div>
    </div>
  )
}

function toRows(g: Record<string, number>): ClanRoleGrantView[] {
  return Object.entries(g)
    .filter(([, a]) => a > 0)
    .map(([grant, actions]) => ({ grant, actions }))
}

function sameGrants(g: Record<string, number>, rows: ClanRoleGrantView[]): boolean {
  const a = toRows(g)
  const b = rows.filter(r => r.actions > 0)
  if (a.length !== b.length) return false
  const map = new Map(b.map(r => [r.grant, r.actions]))
  return a.every(r => map.get(r.grant) === r.actions)
}
