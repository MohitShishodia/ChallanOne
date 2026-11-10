function collectPhoneIdentifiers(value, identifiers = []) {
  if (typeof value === 'number') {
    identifiers.push(String(value));
    return identifiers;
  }
  if (typeof value === 'string') {
    if (value.includes('@') || value.split('.').length === 3) return identifiers;

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return collectPhoneIdentifiers(parsed, identifiers);
      }
    } catch {
      // The response field is plain text rather than serialized JSON.
    }

    const matches = value.match(/\+?\d[\d\s().-]{8,}\d/g) || [];
    identifiers.push(...matches);
    return identifiers;
  }
  if (!value || typeof value !== 'object') return identifiers;

  for (const nestedValue of Object.values(value)) {
    collectPhoneIdentifiers(nestedValue, identifiers);
  }
  return identifiers;
}

export function normalizeMsg91Phone(value, countryCode = '91') {
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith(`0${countryCode}`)) digits = digits.slice(1);
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.startsWith('00')) return digits.slice(2);
  return digits;
}

export function msg91AccessTokenMatchesPhone(data, phone, countryCode = '91') {
  const expectedPhone = normalizeMsg91Phone(phone, countryCode);
  if (!expectedPhone) return false;

  return collectPhoneIdentifiers(data).some(
    identifier => normalizeMsg91Phone(identifier, countryCode) === expectedPhone
  );
}
