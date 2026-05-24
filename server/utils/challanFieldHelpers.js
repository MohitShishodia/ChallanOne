/**
 * Extract offence/offense text from ChallanWala and similar API shapes.
 * ChallanWala uses American spelling: offenseDetails.
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pickString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function formatOffenceEntry(entry) {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry.trim();

  if (isPlainObject(entry)) {
    const name =
      pickString(entry.name) ||
      pickString(entry.offenceName) ||
      pickString(entry.offenseName) ||
      pickString(entry.offence) ||
      pickString(entry.offense) ||
      pickString(entry.description) ||
      pickString(entry.offenceDescription) ||
      pickString(entry.offenseDescription) ||
      pickString(entry['Offence Description']) ||
      pickString(entry['Offense Description']);

    const act =
      pickString(entry.act) ||
      pickString(entry.section) ||
      pickString(entry.offenceSection) ||
      pickString(entry.offenseSection) ||
      pickString(entry.actName) ||
      pickString(entry['OffenceCode']);

    if (name && act) return `${name} (${act})`;
    return name || act;
  }

  return '';
}

function collectFromList(list) {
  if (!Array.isArray(list)) return '';
  return list.map(formatOffenceEntry).filter(Boolean).join('; ');
}

export function getOffenceDetails(raw) {
  if (!raw || typeof raw !== 'object') return 'N/A';

  const direct =
    pickString(raw.offenseDetails) ||
    pickString(raw.offenceDetails) ||
    pickString(raw.offense_details) ||
    pickString(raw.offence_details) ||
    pickString(raw.offenseDescription) ||
    pickString(raw.offenceDescription) ||
    pickString(raw.offense) ||
    pickString(raw.offence) ||
    pickString(raw.violationType) ||
    pickString(raw.violationDescription) ||
    pickString(raw.violationName) ||
    pickString(raw.actDescription) ||
    pickString(raw.description);

  if (direct) return direct;

  const fromList =
    collectFromList(raw.offenseDetailsList) ||
    collectFromList(raw.offenceDetailsList) ||
    collectFromList(raw.offense_details_list) ||
    collectFromList(raw.offence_details_list) ||
    collectFromList(raw.offence_details) ||
    collectFromList(raw.offense_details) ||
    collectFromList(raw.offences) ||
    collectFromList(raw.offenses) ||
    collectFromList(raw.violations);

  if (fromList) return fromList;

  return 'N/A';
}

export function getOffenceSection(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const direct =
    pickString(raw.section) ||
    pickString(raw.offenceSection) ||
    pickString(raw.offenseSection) ||
    pickString(raw.actName);

  if (direct) return direct;

  const list =
    raw.offence_details ||
    raw.offense_details ||
    raw.offenceDetailsList ||
    raw.offenseDetailsList;

  if (Array.isArray(list) && list[0] && isPlainObject(list[0])) {
    return (
      pickString(list[0].act) ||
      pickString(list[0].section) ||
      pickString(list[0].offenceSection) ||
      null
    );
  }

  return null;
}
