import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand'

export default function BrandLogo({ className = '', size = 'md', linkTo = '/', variant = 'default', showText = true }) {
  const sizes = {
    sm: 'h-11 max-w-[140px]',
    md: 'h-14 max-w-[175px]',
    lg: 'h-[4.5rem] max-w-[220px]',
    navbar: 'h-14 max-w-[170px] md:h-[4.5rem] md:max-w-[240px]',
  }

  const img = (
    <img
      src={BRAND.logoSrc}
      alt={BRAND.name}
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  )

  if (!linkTo) return img

  return (
    <Link to={linkTo} className="flex items-center gap-2 shrink-0 group min-w-0">
      {img}
      {showText && (
        <span className={`hidden sm:flex flex-col leading-tight min-w-0 ${variant === 'light' ? 'text-white' : ''}`}>
          <span className={`text-[14px] font-bold tracking-tight transition-colors truncate ${
            variant === 'light' ? 'text-white group-hover:text-red-200' : 'text-slate-900 group-hover:text-brand-red'
          }`}>
            Challan<span className={variant === 'light' ? 'text-red-400' : 'text-brand-red'}>One</span>
          </span>
        </span>
      )}
    </Link>
  )
}
