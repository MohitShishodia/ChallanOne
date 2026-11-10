const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function resolveLoginIdentifier(identifier) {
  if (typeof identifier !== 'string') return null;

  const value = identifier.trim();
  if (EMAIL_PATTERN.test(value)) {
    return { type: 'email', query: { email: value.toLowerCase() } };
  }

  if (!/^\+?[\d\s()-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0091')) digits = digits.slice(4);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);

  if (!PHONE_PATTERN.test(digits)) return null;
  return {
    type: 'phone',
    query: { phone: { $in: [digits, `91${digits}`, `+91${digits}`] } }
  };
}
