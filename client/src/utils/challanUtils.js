export const FLOW_TYPES = {
  SELECT: 'SELECT',
  DELHI_OTP: 'DELHI_OTP',
  ALL_CHALLANS: 'ALL_CHALLANS'
};

export function getChallanDisplayType({ courtChallan, challanType }) {
  const type = (challanType || '').toUpperCase();
  if (courtChallan === true) return 'Court Challan';
  if (type === 'OFFLINE') return 'Physical Challan';
  return 'E-Challan';
}

export function shouldShowExternalChallan(challan) {
  if (challan.sentToVirtualCourt === true) return false;
  const status = (challan.challanStatus || '').toLowerCase();
  if (status === 'paid' || status === 'cash' || status === 'disposed' || status === 'compounded') {
    return false;
  }
  return true;
}

export function formatChallanDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr.split(' ')[0] || dateStr;
  }
}

export function formatChallanTime(dateStr) {
  if (!dateStr) return '00:00';
  try {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const parts = dateStr.split(' ');
    if (parts[1]) return parts[1].substring(0, 5);
    return '00:00';
  } catch {
    return '00:00';
  }
}

export function transformExternalChallans(result) {
  const pendingChallans = result.data?.pendingChallans || [];
  const paidChallans = result.data?.paidChallans || [];
  const disposedChallans = result.data?.disposedChallans || [];
  const allChallans = [...pendingChallans, ...paidChallans, ...disposedChallans];

  const challans = allChallans
    .filter(shouldShowExternalChallan)
    .map((c, idx) => {
      const isCourtChallan = c.courtChallan === true;
      const displayType = getChallanDisplayType({
        courtChallan: isCourtChallan,
        challanType: c.challanType
      });

      return {
        id: c.challanNumber || `CH${idx + 1}`,
        dbId: c.challanNumber,
        vehicleNumber: result.vehicleNumber,
        type: c.challanType || 'N/A',
        description: c.challanPlace || 'N/A',
        amount: parseFloat(c.amount) || 0,
        status: 'PENDING',
        date: formatChallanDate(c.challanDate),
        time: formatChallanTime(c.challanDate),
        location: c.challanPlace || c.courtAddress || 'N/A',
        displayType,
        isCourtChallan,
        courtFee: isCourtChallan ? 50 : 0
      };
    });

  const firstChallan = allChallans[0];
  const vehicle = {
    number: result.vehicleNumber,
    owner: firstChallan?.accusedName || 'Owner',
    vehicleType: 'Private Vehicle',
    isVerified: true
  };

  return {
    success: true,
    dataSource: result.source || 'EXTERNAL',
    vehicle,
    challans,
    pendingCount: challans.length,
    hasRawChallans: allChallans.length > 0
  };
}

export function calculatePaymentTotal(challans, convenienceFee = 20) {
  const subtotal = challans.reduce((s, c) => s + c.amount, 0);
  const courtFeeTotal = challans.reduce((s, c) => s + (c.courtFee || 0), 0);
  const total = subtotal + courtFeeTotal + convenienceFee;
  return { subtotal, courtFeeTotal, convenienceFee, total };
}
