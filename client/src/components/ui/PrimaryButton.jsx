export default function PrimaryButton({
  children,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button type={type} className={`btn-primary ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
