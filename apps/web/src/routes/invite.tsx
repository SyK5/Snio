import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Centered } from '@/components/ui/centered'
import { useAuthStore } from '@/features/auth/auth.store'
import { useInvitePreview, useRedeemInvite } from '@/features/clan/invite.hooks'
import { resolveClanError } from '@/features/clan/clan.errors'
import { m } from '@/i18n/paraglide/messages'

export function InvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const accessToken = useAuthStore(s => s.accessToken)
  const authReady = useAuthStore(s => s.authReady)
  const { data: preview, isLoading, isError } = useInvitePreview(code)
  const redeem = useRedeemInvite()

  if (!authReady) return <Centered>{m.invite_page_loading()}</Centered>
  if (!accessToken) return <Navigate to={`/login?redirect=/invite/${code}`} replace />
  if (isLoading) return <Centered>{m.invite_page_loading()}</Centered>
  if (isError || !preview) return <Invalid onBack={() => navigate('/clans')} />

  const onJoin = () =>
    redeem.mutate(code, {
      onSuccess: clan => {
        toast.success(m.invite_page_joined())
        navigate(`/clans/${clan.id}`)
      },
      onError: e => toast.error(resolveClanError(e)),
    })

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <Card className="w-full text-center">
        <Avatar fallback={preview.tag.slice(0, 2)} size={56} className="mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{m.invite_page_join_title()}</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{preview.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">[{preview.tag}]</p>
        <Button block className="mt-6" onClick={onJoin} loading={redeem.isPending}>
          <FontAwesomeIcon icon={faRightToBracket} className="mr-2 text-xs" />
          {m.invite_page_join_action()}
        </Button>
      </Card>
    </div>
  )
}

function Invalid({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <Card className="w-full text-center">
        <h1 className="text-lg font-semibold text-foreground">{m.invite_page_invalid()}</h1>
        <Button variant="ghost" className="mt-5" onClick={onBack}>
          {m.invite_page_to_clans()}
        </Button>
      </Card>
    </div>
  )
}
