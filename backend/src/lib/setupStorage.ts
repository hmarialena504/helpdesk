import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'

export const setupStorage = async (): Promise<void> => {
  const s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true,
  })

  const BUCKET = process.env.S3_BUCKET || 'helpdesk-attachments'

  try {
    // Check if bucket already exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }))
    console.log(`📦 Storage bucket '${BUCKET}' already exists`)
  } catch {
    // Bucket doesn't exist — create it
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }))

      // Set bucket policy to allow public read access
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET}/*`],
          },
        ],
      })

      await s3Client.send(
        new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy })
      )

      console.log(`📦 Storage bucket '${BUCKET}' created`)
    } catch (err) {
      console.error('📦 Failed to create storage bucket:', err)
    }
  }
}