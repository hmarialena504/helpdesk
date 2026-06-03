'use client'

import { useState, useRef } from 'react'
import { Paperclip, Upload, Trash2, FileText, Image, X } from 'lucide-react'
import {
  uploadAttachment,
  deleteAttachment,
  formatFileSize,
  isImage,
  Attachment,
} from '@/lib/attachmentService'
import { useAuth } from '@/lib/authContext'

interface AttachmentListProps {
  ticketId: string
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
}

export default function AttachmentList({
  ticketId,
  attachments,
  onAttachmentsChange,
}: AttachmentListProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setIsUploading(true)

    try {
      const res = await uploadAttachment(ticketId, file)
      onAttachmentsChange([...attachments, res.data])
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Upload failed'
      setUploadError(message)
    } finally {
      setIsUploading(false)
      // Reset the file input so the same file can be uploaded again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    setDeletingId(attachment.id)
    try {
      await deleteAttachment(ticketId, attachment.id)
      onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id))
    } finally {
      setDeletingId(null)
    }
  }

  const canDelete = (attachment: Attachment) =>
    user?.role === 'ADMIN' || attachment.uploadedBy.id === user?.id

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Attachments ({attachments.length})
          </h2>
        </div>

        {/* Upload button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isUploading ? (
              <>
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                Upload file
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-xs text-red-700">{uploadError}</p>
          <button onClick={() => setUploadError('')}>
            <X className="w-3 h-3 text-red-500" />
          </button>
        </div>
      )}

      {/* Attachment list */}
      <div className="divide-y divide-gray-100">
        {attachments.length === 0 ? (
          <div className="p-6 text-center">
            <Paperclip className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No attachments yet</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              {/* File icon or image preview */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {isImage(attachment.mimetype) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {attachment.filename}
                </a>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFileSize(attachment.size)} · {attachment.uploadedBy.name}
                </p>
              </div>

              {/* Delete button */}
              {canDelete(attachment) && (
                <button
                  onClick={() => handleDelete(attachment)}
                  disabled={deletingId === attachment.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                  title="Delete attachment"
                >
                  {deletingId === attachment.id ? (
                    <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}