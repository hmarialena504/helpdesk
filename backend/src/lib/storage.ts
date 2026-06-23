import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

// Create the S3 client — works with AWS S3, MinIO, Cloudflare R2,
// or any S3-compatible service by changing the endpoint
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  // Required for MinIO and other non-AWS S3 services
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || 'helpdesk-attachments'

export interface UploadedFile {
  key: string
  url: string
  filename: string
  mimetype: string
  size: number
}

// Upload a file buffer to S3
export const uploadFile = async (
  buffer: Buffer,
  originalFilename: string,
  mimetype: string,
  ticketId: string,
): Promise<UploadedFile> => {
  // Generate a unique key to prevent filename collisions
  // Structure: tickets/{ticketId}/{uuid}/{filename}
  const uuid = randomUUID()
  const key = `tickets/${ticketId}/${uuid}/${originalFilename}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // Allow public read access so files can be viewed in browser
      ACL: 'public-read',
    })
  )

  // Build the public URL
  // For Cloudflare R2: use the public bucket URL
  // For MinIO/AWS: construct from endpoint and bucket
  const publicUrl = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL}/${key}`
    : `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`

  return { key, url: publicUrl, filename: originalFilename, mimetype, size: buffer.length }
  
}

// Delete a file from S3
export const deleteFile = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

// Generate a temporary signed URL for private files
// Useful if you later want to make files private
export const getSignedFileUrl = async (
  key: string,
  expiresInSeconds = 3600,
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds })
}