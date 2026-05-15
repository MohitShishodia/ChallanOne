export default function AppCard({ children, className = '' }) {
  return <div className={`app-card ${className}`.trim()}>{children}</div>
}
