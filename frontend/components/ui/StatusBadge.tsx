interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-50 text-gray-600 border border-gray-200',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-50 text-gray-600 border border-gray-200',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}