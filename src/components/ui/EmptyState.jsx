export default function EmptyState({ icon = '📦', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-brand-dark mb-2">{title}</h3>
      {subtitle && <p className="text-brand-muted text-sm mb-6 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  )
}
