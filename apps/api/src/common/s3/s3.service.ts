import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Config } from './s3.config'

@Injectable()
export class S3Service {
  private readonly client: S3Client

  constructor(@Inject(s3Config.KEY) private readonly config: ConfigType<typeof s3Config>) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    })
  }

  get avatarMaxBytes(): number {
    return this.config.avatarMaxBytes
  }

  presignUpload(key: string, contentType: string, maxBytes: number): Promise<PresignedPost> {
    return createPresignedPost(this.client, {
      Bucket: this.config.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 1, maxBytes],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: this.config.presignTtl,
    })
  }

  presignDownload(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.config.bucket, Key: key })
    return getSignedUrl(this.client, command, { expiresIn: this.alignedTtl() })
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }))
  }

  private alignedTtl(): number {
    const ttl = this.config.presignTtl
    const elapsed = Math.floor(Date.now() / 1000) % ttl
    return ttl - elapsed
  }
}
