import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { uploadFile, deleteFile } from '../lib/storage'
import { AppError } from '../middleware/errorHandler'

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Max file size — 10MB
const MAX_SIZE = 10 * 1024 * 1024

// POST /api/tickets/:id/attachments
export const uploadAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: ticketId } = req.params

    // multer puts the uploaded file on req.file
    const file = req.file
    if (!file) {
      throw new AppError('No file provided', 400)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new AppError(
        'File type not allowed. Allowed types: images, PDF, Word documents, text files',
        400,
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      throw new AppError('File too large. Maximum size is 10MB', 400)
    }

    // Verify the ticket exists and the user has access
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw new AppError('Ticket not found', 404)
    }

    if (
      req.user?.role === 'CUSTOMER' &&
      ticket.createdById !== req.user.id
    ) {
      throw new AppError('Ticket not found', 404)
    }

    // Upload to S3
    const uploaded = await uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      ticketId,
    )

    // Save attachment record to database
    const attachment = await prisma.attachment.create({
      data: {
        filename: uploaded.filename,
        key: uploaded.key,
        url: uploaded.url,
        mimetype: uploaded.mimetype,
        size: uploaded.size,
        ticketId,
        uploadedById: req.user!.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    })

    res.status(201).json({ data: attachment })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/tickets/:id/attachments/:attachmentId
export const deleteAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { attachmentId } = req.params

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      throw new AppError('Attachment not found', 404)
    }

    // Only the uploader or an admin can delete an attachment
    if (
      req.user?.role !== 'ADMIN' &&
      attachment.uploadedById !== req.user?.id
    ) {
      throw new AppError('Insufficient permissions', 403)
    }

    // Delete from S3 first
    await deleteFile(attachment.key)

    // Then delete the database record
    await prisma.attachment.delete({ where: { id: attachmentId } })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// GET /api/tickets/:id/attachments
export const getAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: ticketId } = req.params

    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ data: attachments })
  } catch (err) {
    next(err)
  }
}