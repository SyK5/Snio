export interface AuthUser {
  id: string
  email: string
  email_verified: boolean
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AccessResponse {
  accessToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}
