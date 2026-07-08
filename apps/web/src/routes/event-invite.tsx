import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Centered } from '@/components/ui/centered'
import { useAuthStore } from '@/features/auth/auth.store'
import { useEventInvitePreview, useRedeemEventInvite } from '@/features/event/event-invite.hooks'
import { resolveEventError } from '@/features/event/event.errors'
import { m } from '@/i18n/paraglide/messages'

export function EventInvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const accessToken = useAuthStore(s => s.accessToken)
  const authReady = useAuthStore(s => s.authReady)
  const { data: preview, isLoading, isError } = useEventInvitePreview(code)
  const redeem = useRedeemEventInvite()

  if (!authReady) return <Centered>{m.invite_page_loading()}</Centered>
  if (!accessToken) return <Navigate to={`/login?redirect=/event-invite/${code}`} replace />
  if (isLoading) return <Centered>{m.invite_page_loading()}</Centered>
  if (isError || !preview) return <Invalid onBack={() => navigate('/events')} />

  const onJoin = () =>
    redeem.mutate(code, {
      onSuccess: event => {
        toast.success(m.event_redeem_joined())
        navigate(`/events/${event.id}`)
      },
      onError: e => toast.error(resolveEventError(e)),
    })

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <Card className="w-full text-center">
        <p className="text-sm text-muted-foreground">{m.event_redeem_title()}</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{preview.title}</h1>
        <Button block className="mt-6" onClick={onJoin} loading={redeem.isPending}>
          <FontAwesomeIcon icon={faRightToBracket} className="mr-2 text-xs" />
          {m.event_redeem_action()}
        </Button>
      </Card>
    </div>
  )
}

function Invalid({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <Card className="w-full text-center">
        <h1 className="text-lg font-semibold text-foreground">{m.event_redeem_invalid()}</h1>
        <Button variant="ghost" className="mt-5" onClick={onBack}>
          {m.event_redeem_back()}
        </Button>
      </Card>
    </div>
  )
}
