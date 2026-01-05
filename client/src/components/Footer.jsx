import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt="Challan One Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">Challan One</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Simplifying traffic fine payments for citizens. Check, verify, and pay your challans instantly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/track-challan" className="text-sm hover:text-white transition-colors">Track Challan</Link></li>
              <li><Link to="/support" className="text-sm hover:text-white transition-colors">Dispute Resolution</Link></li>
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Receipts</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/support" className="text-sm hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/support" className="text-sm hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Official Partners */}
          <div>
            <h3 className="text-white font-semibold mb-4">Official Partners</h3>
            <div className="flex gap-3">
              <div className="bg-gray-800 px-3 py-2 rounded text-xs font-medium">MoRTH</div>
              <div className="bg-gray-800 px-3 py-2 rounded text-xs font-medium">Digital India</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2025 Challan One. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
