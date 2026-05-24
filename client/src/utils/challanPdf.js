import { jsPDF } from 'jspdf';

/**
 * Download a PDF listing all challans for a vehicle.
 * @param {{ number: string, owner?: string }} vehicle
 * @param {Array} challans - normalized challan records
 */
export function downloadChallansPdf(vehicle, challans) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const addPageIfNeeded = (needed = 12) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Challan Report', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Vehicle: ${vehicle?.number || 'N/A'}`, margin, y);
  y += 5;
  if (vehicle?.owner) {
    doc.text(`Owner: ${vehicle.owner}`, margin, y);
    y += 5;
  }
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, y);
  y += 5;
  doc.text(`Total challans: ${challans.length}`, margin, y);
  y += 8;

  challans.forEach((c, index) => {
    addPageIfNeeded(42);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${index + 1}. Notice ID: ${c.noticeId || c.id}`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const lines = [
      `Status: ${c.status === 'PAID' ? 'Paid' : 'Pending'}  |  Type: ${c.displayType || 'N/A'}`,
      `Date: ${c.date || 'N/A'}  |  Time: ${c.time || 'N/A'}`,
      `Fine: Rs. ${(c.amount || 0).toLocaleString('en-IN')}`,
      `Location: ${c.location || 'N/A'}`,
      `Offence: ${c.offenceDetails || 'N/A'}`
    ];

    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, contentWidth);
      addPageIfNeeded(wrapped.length * 4 + 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4 + 1;
    });

    y += 4;
  });

  addPageIfNeeded(10);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by Challan One', margin, doc.internal.pageSize.getHeight() - 10);
  doc.setTextColor(0, 0, 0);

  const safeVehicle = (vehicle?.number || 'vehicle').replace(/[^A-Z0-9]/gi, '_');
  doc.save(`challans_${safeVehicle}_${Date.now()}.pdf`);
}
