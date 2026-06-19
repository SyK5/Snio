export interface GameView {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

export interface CreateGamePayload {
  name: string
  iconKey?: string
}

export interface UpdateGamePayload {
  name?: string
  iconKey?: string | null
}

export interface GameIconPresignResponse {
  key: string
  url: string
  fields: Record<string, string>
  maxBytes: number
}

export const GAME_ICON_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
export type GameIconType = (typeof GAME_ICON_TYPES)[number]
