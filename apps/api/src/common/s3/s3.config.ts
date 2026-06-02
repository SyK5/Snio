import { registerAs } from '@nestjs/config'

export const s3Config = registerAs('s3', () => ({
  endpoint: required('S3_ENDPOINT'),
  region: process.env.S3_REGION ?? 'us-east-1',
  bucket: required('S3_BUCKET_UPLOADS'),
  accessKey: required('S3_ACCESS_KEY'),
  secretKey: required('S3_SECRET_KEY'),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  publicUrl: process.env.S3_PUBLIC_URL || undefined,
  presignTtl: Number(process.env.S3_PRESIGN_TTL ?? 900),
  avatarMaxBytes: Number(process.env.S3_AVATAR_MAX_BYTES ?? 5_242_880),
}))

export type S3Config = ReturnType<typeof s3Config>

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} fehlt`)
  return value
}
