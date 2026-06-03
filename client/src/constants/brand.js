export const BRAND = {
  name: 'Challan One',
  tagline: 'Your trusted partner for challan clearance',
  logoSrc: '/challanone-logo.png',
  colors: {
    red: '#DC2626',
    redDark: '#B91C1C',
    black: '#0A0A0A',
    white: '#FFFFFF',
  },
}

export const WHATSAPP = {
  number: '917409302432',
  display: '+91 74093 02432',
  defaultMessage: 'Hi! I need help with challan clearance from Challan One.',
}

export function whatsappUrl(message = WHATSAPP.defaultMessage) {
  return `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(message)}`
}
