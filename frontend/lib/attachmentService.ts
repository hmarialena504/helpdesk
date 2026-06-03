import api from './api'

export interface Attachment {
  id: string
  filename: string
  url: string
  mimetype: string
  size: number
  createdAt: string
  uploadedBy: { id: string; name: string }
}

export const uploadAttachment = async (
  ticketId: string,
  file: File,
): Promise<{ data: Attachment }> => {
  // Files must be sent as FormData not JSON
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post(
    `/api/tickets/${ticketId}/attachments`,
    formData,
    {
      headers: {
        // Let axios set Content-Type automatically for FormData
        // Setting it manually breaks the multipart boundary
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return res.data
}

export const deleteAttachment = async (
  ticketId: string,
  attachmentId: string,
): Promise<void> => {
  await api.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const isImage = (mimetype: string): boolean =>
  mimetype.startsWith('image/')