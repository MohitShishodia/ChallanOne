import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { WHATSAPP } from '../constants/brand'

const HIDDEN_PATHS = ['/login']

export default function SiteFooter() {
  const { pathname } = useLocation()
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <footer className="site-footer">
      <div className="container-main">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-10">
          <div>
            <div className="mb-4">
              <BrandLogo linkTo="/" size="sm" variant="light" />
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              India's most trusted platform for checking traffic challans and vehicle registration details.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h4>
            <div className="space-y-2.5">
              <Link to="/pay-challan" className="block text-[14px]">Check Challan</Link>
              <Link to="/rc-details" className="block text-[14px]">RC Details</Link>
              <Link to="/service-history" className="block text-[14px]">Service History</Link>
              <Link to="/about" className="block text-[14px]">About Us</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Support</h4>
            <div className="space-y-2.5">
              <Link to="/support" className="block text-[14px]">Help Center</Link>
              <a href="mailto:support@challanone.com" className="block text-[14px]">support@challanone.com</a>
              <a href={`tel:+${WHATSAPP.number}`} className="block text-[14px]">{WHATSAPP.display}</a>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Office</h4>
            <p className="text-[14px] leading-relaxed">
              193, Tech Park, Sector 62,<br />Noida, UP - 201301
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-white tracking-wider uppercase mb-4">Legal</h4>
            <div className="space-y-2.5">
              <Link to="/privacy" className="block text-[14px]">Privacy Policy</Link>
              <Link to="/terms" className="block text-[14px]">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px]">
          <span>© {new Date().getFullYear()} ChallanOne. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-slate-700">·</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
