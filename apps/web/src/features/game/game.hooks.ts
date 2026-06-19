import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/auth.store'
import { gameApi } from './game.api'
import type { CreateGamePayload, GameView, UpdateGamePayload } from './game.types'

const GAMES_KEY = ['games'] as const

export function useGames() {
  const accessToken = useAuthStore(s => s.accessToken)
  return useQuery({ queryKey: GAMES_KEY, queryFn: gameApi.list, enabled: !!accessToken, staleTime: 5 * 60_000 })
}

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGamePayload) => gameApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: GAMES_KEY }),
  })
}

export function useUpdateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, payload }: { gameId: string; payload: UpdateGamePayload }) => gameApi.update(gameId, payload),
    onSuccess: game => qc.setQueryData<GameView[]>(GAMES_KEY, prev => prev?.map(g => (g.id === game.id ? game : g)) ?? prev),
  })
}

export function useDeleteGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (gameId: string) => gameApi.remove(gameId),
    onSuccess: (_data, gameId) => qc.setQueryData<GameView[]>(GAMES_KEY, prev => prev?.filter(g => g.id !== gameId) ?? prev),
  })
}
