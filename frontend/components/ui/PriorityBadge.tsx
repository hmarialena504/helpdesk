interface PriorityBadgeProps {
  priority: string
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: {
    label: 'Low',
    className: 'bg-gray-50 text-gray-600 border border-gray-200',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || {
    label: priority,
    className: 'bg-gray-50 text-gray-600 border border-gray-200',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}