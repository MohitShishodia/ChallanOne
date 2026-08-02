import Navbar from './Navbar'
import SiteFooter from './SiteFooter'

export default function AppShell({ children }) {
  return (
    <div className="app-frame">
      <Navbar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
