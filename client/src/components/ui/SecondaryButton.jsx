export default function SecondaryButton({
  children,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button type={type} className={`btn-secondary ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
