export default function InputField({ label, id, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <input id={id} className={`input-base ${className}`.trim()} {...props} />
    </label>
  )
}
