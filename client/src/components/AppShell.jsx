import Navbar from './Navbar'

export default function AppShell({ children }) {
  return (
    <div className="app-frame">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
