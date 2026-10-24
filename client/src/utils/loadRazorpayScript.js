export default function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]')
    if (existing) {
      existing.onload = () => resolve(true)
      existing.onerror = () => resolve(false)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
