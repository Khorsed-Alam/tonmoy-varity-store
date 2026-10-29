import { ORDER_STATUS } from '../../lib/utils'

export default function OrderStatusBadge({ status }) {
  const info = ORDER_STATUS[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`badge ${info.color}`}>
      {info.label}
    </span>
  )
}
