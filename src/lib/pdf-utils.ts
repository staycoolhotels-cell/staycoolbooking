import { Transaction } from './types';

export const generateInvoicePDF = async (t: Transaction) => {
  // Use dynamic import for client-side libraries
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const invoiceId = t.invoice_id || (t.id ? t.id.split('-')[0].toUpperCase() : 'N/A');

  // Branding & Logo
  try {
    const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Important for CORS if needed
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

    // Try to load the specific branding image requested
    const logo = await loadImage('/assets/Picsart_26-03-22_23-32-24-684.png');
    // Using a wider aspect ratio (45x12) as this image appears to be a brand name combo
    doc.addImage(logo, 'PNG', 14, 10, 45, 12);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Ultra-Luxury Private Transfers & Stays', 14, 28);
  } catch (e) {
    console.error('Failed to load branding image, falling back to text-only header', e);
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233); // Sky blue
    doc.text('STAYCOOL BOOKING', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Ultra-Luxury Private Transfers & Stays', 14, 27);
  }

  // Invoice Meta
  doc.setFontSize(20);
  doc.setTextColor(30);
  doc.text('INVOICE', 140, 22);
  doc.setFontSize(10);
  doc.text(`ID: #${invoiceId}`, 140, 30);
  doc.text(`Date: ${t.date || new Date().toLocaleDateString()}`, 140, 36);

  // Bill To
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('BILL TO', 14, 50);
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(t.guestName || 'Valued Guest', 14, 58);

  // Details Grid
  doc.setDrawColor(240);
  doc.line(14, 65, 196, 65);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('PROPERTY', 14, 75);
  doc.text('BOOKING ID', 100, 75);
  doc.text('PAYMENT METHOD', 150, 75);

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(t.propertyName || 'Property Details', 14, 82);
  doc.text(t.booking_id || 'N/A', 100, 82);
  doc.text(t.paymentMethod || 'Razorpay', 150, 82);

  // Financial Breakdown
  const breakdown = t.breakdown || {
    accommodation: (t.amount || 0) * 0.88,
    service_fee: (t.amount || 0) * 0.10,
    taxes: (t.amount || 0) * 0.02
  };

  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Unit', 'Amount']],
    body: [
      ['Accommodation Charges', '1', `INR ${breakdown.accommodation.toLocaleString()}`],
      ['Platform Service Fee', '1', `INR ${breakdown.service_fee.toLocaleString()}`],
      ['IGST / SGST (Taxes)', '1', `INR ${breakdown.taxes.toLocaleString()}`],
    ],
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Total Section
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('TOTAL AMOUNT PAID', 120, finalY + 10);
  doc.setFontSize(16);
  doc.setTextColor(14, 165, 233);
  doc.text(`INR ${t.amount.toLocaleString()}`, 120, finalY + 20);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  const footerY = 280;
  doc.text('This is a computer-generated document. No signature required.', 105, footerY, { align: 'center' });
  doc.text('Support: hello@staycoolbooking.com | StayCool Tech Solutions', 105, footerY + 5, { align: 'center' });

  doc.save(`STAYCOOL_INV_${invoiceId}.pdf`);
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  if (transactions.length === 0) return;

  const headers = ['ID', 'Date', 'Guest', 'Host', 'Property', 'Amount', 'Status', 'Method'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.guestName,
    t.hostName,
    t.propertyName,
    t.amount,
    t.status,
    t.paymentMethod
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `StayCool_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
