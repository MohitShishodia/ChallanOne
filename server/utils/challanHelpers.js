export function maskName(name) {
  if (!name) return 'Unknown';
  const parts = name.split(' ');
  return parts.map(p => p[0] + '***').join(' ');
}

export function formatChallanDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatChallanTime(timeStr) {
  if (!timeStr) return '00:00';
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }
  return String(timeStr).substring(0, 5);
}

export function normalizeVehicleParam(vehicleNumber) {
  return vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
