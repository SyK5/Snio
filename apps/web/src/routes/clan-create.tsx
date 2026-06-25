import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Page, PageHeader } from '@/components/ui/page'
import { TextField } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useCreateClan } from '@/features/clan/clan.hooks'
import { createClanSchema, type CreateClanForm } from '@/features/clan/clan.schemas'
import { m } from '@/i18n/paraglide/messages'

export function CreateClanPage() {
  const navigate = useNavigate()
  const create = useCreateClan()
  const { register, handleSubmit, formState } = useForm<CreateClanForm>({ resolver: zodResolver(createClanSchema), mode: 'onTouched' })

  const onSubmit = (values: CreateClanForm) =>
    create.mutate(values, {
      onSuccess: clan => {
        toast.success(m.clan_created())
        navigate(`/clans/${clan.id}`)
      },
      onError: error => toast.error(resolveError(error)),
    })

  return (
    <Page width="sm">
      <PageHeader title={m.clan_create_title()} />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <TextField label={m.clan_field_name()} error={formState.errors.name?.message} maxLength={40} {...register('name')} />
          <TextField label={m.clan_field_tag()} error={formState.errors.tag?.message} maxLength={8} {...register('tag')} />
          <TextField label={m.clan_field_description()} error={formState.errors.description?.message} maxLength={500} {...register('description')} />
          <Button type="submit" loading={create.isPending} className="mt-2 self-start">
            {m.clan_create_action()}
          </Button>
        </form>
      </Card>
    </Page>
  )
}

function resolveError(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) return m.clan_error_tag_taken()
  return m.clan_error_generic()
}
