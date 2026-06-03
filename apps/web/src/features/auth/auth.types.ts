export interface AuthUser {
  id: string
  email: string
  username: string
  email_verified: boolean
  display_name: string
  discriminator: string
  avatar_url: string | null
  pending_fields: string[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AccessResponse {
  accessToken: string
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
  displayName: string
}

export interface AvailabilityResponse {
  available: boolean
}
