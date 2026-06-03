import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand'

export default function BrandLogo({ className = '', size = 'md', linkTo = '/', variant = 'default' }) {
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  }

  const img = (
    <img
      src={BRAND.logoSrc}
      alt={BRAND.name}
      className={`${sizes[size]} rounded-full object-cover border border-slate-200/80 bg-white shadow-sm ${className}`}
    />
  )

  if (!linkTo) return img

  return (
    <Link to={linkTo} className="flex items-center gap-2.5 shrink-0 group">
      {img}
      <span className={`hidden sm:flex flex-col leading-tight ${variant === 'light' ? 'text-white' : ''}`}>
        <span className={`text-[15px] font-bold tracking-tight transition-colors ${
          variant === 'light' ? 'text-white group-hover:text-red-200' : 'text-slate-900 group-hover:text-brand-red'
        }`}>
          Challan<span className={variant === 'light' ? 'text-red-400' : 'text-brand-red'}>One</span>
        </span>
        <span className={`text-[9px] font-medium uppercase tracking-wider max-w-[140px] truncate ${
          variant === 'light' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Challan Clearance
        </span>
      </span>
    </Link>
  )
}
