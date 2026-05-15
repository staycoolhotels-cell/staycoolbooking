import { Transaction } from './types';

export const generateInvoicePDF = async (t: Transaction) => {
  // Use UMD import for better compatibility with Next.js dynamic chunks
  const jspdfModule = await import('jspdf/dist/jspdf.umd.min.js') as any;
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const isRefund = t.type === 'refund';
  const invoiceId = t.invoice_id || (t.id ? t.id.split('-')[0].toUpperCase() : 'N/A');

  // 1. Dark Header & Accent Bar
  doc.setFillColor(31, 33, 40); // Charcoal Black
  doc.rect(0, 0, 210, 50, 'F');
  
  // Sky Blue Accent Bar
  doc.setFillColor(14, 165, 233); 
  doc.rect(0, 50, 210, 4, 'F');

  // Branding Logos
  try {
    const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; 
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

    const logo = await loadImage('/assets/images/logo.png');
    const secondaryLogo = await loadImage('/assets/Picsart_26-03-22_23-32-24-684.png');
    
    // Calculate aspect ratios to prevent squashing
    const logoRatio = logo.width / logo.height;
    const secRatio = secondaryLogo.width / secondaryLogo.height;
    
    const targetH = 10; // Reset height
    const logoW = targetH * logoRatio;
    const secW = targetH * secRatio;

    // Place them side-by-side horizontally
    doc.addImage(logo, 'PNG', 16, 20, logoW, targetH);
    doc.addImage(secondaryLogo, 'PNG', 16 + logoW + 4, 20, secW, targetH);
  } catch (e) {
    console.error('Failed to load logos for PDF', e);
  }

  doc.setTextColor(14, 165, 233); // Sky Blue
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const title = isRefund ? 'REFUND INVOICE' : 'INVOICE';
  doc.text(title, 194, 30, { align: 'right' });

  // 2. Info Section (Dark background continued for labels)
  doc.setFillColor(31, 33, 40);
  doc.rect(0, 54, 210, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice to:', 16, 68);
  
  doc.setFontSize(14);
  doc.text(t.guestName || 'Valued Guest', 16, 76);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (t.guestAddress) {
    const addressLines = doc.splitTextToSize(t.guestAddress, 100);
    doc.text(addressLines, 16, 82);
  } else {
    doc.text('Address not provided', 16, 82);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice#', 140, 76);
  doc.text('Date:', 140, 83);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoiceId}`, 170, 76);
  doc.text(`${t.date || new Date().toLocaleDateString()}`, 170, 83);

  // Optional Dates
  let currentY = 88;
  doc.setFontSize(8);
  if (t.bookingDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Date:', 140, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.bookingDate}`, 170, currentY);
    currentY += 5;
  }
  if (t.cancellationDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Cancellation Date:', 140, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.cancellationDate}`, 170, currentY);
    currentY += 5;
  }
  if (t.refundDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Refund Date:', 140, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.refundDate}`, 170, currentY);
    currentY += 5;
  }
  
  if (isRefund) {
    if (t.daysBeforeCheckIn !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11); // Amber-500 equivalent
      doc.text('Cancellation Lead:', 140, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${t.daysBeforeCheckIn} Days Before`, 170, currentY);
      currentY += 5;
    }
    if (t.appliedPolicy) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 165, 233); // Sky-400 equivalent
      doc.text('Applied Policy:', 140, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const policyLines = doc.splitTextToSize(t.appliedPolicy, 35);
      doc.text(policyLines, 170, currentY);
      doc.setFontSize(9);
    }
  }

  doc.setTextColor(255, 255, 255); // Reset color for later use if needed

  // 3. Table - Matches requested clean modern style
  const breakdown = t.breakdown || {
    accommodation: (t.amount || 0) * 0.78,
    service_fee: (t.amount || 0) * 0.20,
    taxes: (t.amount || 0) * 0.02
  };

  autoTable(doc, {
    startY: 110,
    head: [['SL.', 'Item Description', 'Price', 'Nights', 'Total']],
    body: [
      ['1', 'Accommodation Charges', `INR ${breakdown.accommodation.toLocaleString('en-IN')}`, '1', `INR ${breakdown.accommodation.toLocaleString('en-IN')}`],
      ['2', 'Platform Service', `INR ${breakdown.service_fee.toLocaleString('en-IN')}`, '1', `INR ${breakdown.service_fee.toLocaleString('en-IN')}`],
      ['3', 'Applicable Taxes (GST/Stay Tax)', `INR ${breakdown.taxes.toLocaleString('en-IN')}`, '1', `INR ${breakdown.taxes.toLocaleString('en-IN')}`],
    ],
    headStyles: { 
      fillColor: [240, 242, 245], 
      textColor: [31, 33, 40], 
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4,
      valign: 'middle'
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      fontSize: 9,
      cellPadding: 6,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left' },
      2: { halign: 'left', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'left', cellWidth: 35 }
    },
    theme: 'plain',
    didDrawCell: (data) => {
      // Draw bottom border line only
      if (data.section === 'body') {
        doc.setDrawColor(240);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // 4. Footer - Thank you section
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('THANK YOU FOR CHOOSING', 16, finalY);
  doc.setFontSize(22);
  doc.setTextColor(14, 165, 233); // Sky Blue
  doc.text('STAY COOL', 16, finalY + 10);

  // Financial Breakdown on Right
  doc.setFontSize(10);
  doc.setTextColor(31, 33, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total:', 140, finalY);
  doc.text('Tax:', 140, finalY + 10);
  doc.setFontSize(12);
  doc.text(isRefund ? 'Total Refund:' : 'Total:', 140, finalY + 25);

  doc.setFont('helvetica', 'normal');
  doc.text(`INR ${t.amount.toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });
  doc.text(`0.00%`, 195, finalY + 10, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233); // Sky Blue for total
  doc.text(`INR ${t.amount.toLocaleString('en-IN')}`, 195, finalY + 25, { align: 'right' });

  // Divider
  doc.setDrawColor(240);
  doc.line(140, finalY + 16, 195, finalY + 16);

  // Terms
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 16, finalY + 35);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.setFontSize(7);

  const term1 = "The guest is fully responsible for maintaining the property in good condition throughout the duration of their stay.";
  const term2 = "Refunds are processed according to the Tiered Refund Schedule based on cancellation timing relative to check-in.";
  const term3 = "StayCool acts solely as a platform provider and is not a direct party to the accommodation contract between the guest and host.";
  const term4 = "Availability of luxury services and amenities is subject to change without prior notice.";

  const maxW = 100;
  let termY = finalY + 41;
  [term1, term2, term3, term4].forEach((term) => {
    const lines = doc.splitTextToSize(term, maxW);
    doc.text(lines, 16, termY);
    termY += lines.length * 4 + 2;
  });

  // Stamp Badge in PDF
  const stampX = 130;
  const stampY = finalY + 45;

  if (isRefund) {
    try {
      const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      });
      const refundStamp = await loadImage('/assets/images/refund-stamp.png');
      doc.addImage(refundStamp, 'PNG', stampX, stampY - 10, 60, 25, undefined, 'FAST', -10);
    } catch (e) {
      console.error('Failed to load refund stamp', e);
      // Fallback to text
      doc.setDrawColor(244, 63, 94);
      doc.setTextColor(244, 63, 94);
      doc.setLineWidth(1.5);
      doc.setFontSize(30);
      doc.setFont('helvetica', 'bold');
      doc.rect(stampX, stampY, 50, 18);
      doc.text('REFUND', stampX + 25, stampY + 13, { align: 'center', angle: -10 } as any);
    }
  } else {
    // Stamp Badge for PAID
    try {
      const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      });
      const paidStamp = await loadImage('/assets/images/paid-stamp.png');
      doc.addImage(paidStamp, 'PNG', stampX, stampY - 10, 60, 25, undefined, 'FAST', -10);
    } catch (e) {
      console.error('Failed to load paid stamp', e);
      // Fallback to text
      doc.setDrawColor(16, 185, 129);
      doc.setTextColor(16, 185, 129);
      doc.setLineWidth(1.5);
      doc.setFontSize(30);
      doc.setFont('helvetica', 'bold');
      doc.rect(stampX, stampY, 50, 18);
      doc.text('PAID', stampX + 25, stampY + 13, { align: 'center', angle: -10 } as any);
    }
  }

  doc.save(`STAYCOOL_INV_${invoiceId}.pdf`);
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) return;

  const headers = ['ID', 'Date', 'Guest', 'Host', 'Property', 'Amount', 'Status', 'Method'];
  const rows = transactions.map(t => [
    `"${t.transactionId || t.id || 'N/A'}"`,
    `"${t.date || 'N/A'}"`,
    `"${(t.guestName || 'N/A').replace(/"/g, '""')}"`,
    `"${(t.hostName || 'N/A').replace(/"/g, '""')}"`,
    `"${(t.propertyName || 'N/A').replace(/"/g, '""')}"`,
    t.amount || 0,
    `"${(t.status || 'N/A').toUpperCase()}"`,
    `"${t.paymentMethod || 'N/A'}"`
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

export const exportTransactionsToPDF = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return;

  // Use UMD import for better compatibility with Next.js dynamic chunks
  const jspdfModule = await import('jspdf/dist/jspdf.umd.min.js') as any;
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // 1. Dark Header & Accent Bar
  doc.setFillColor(31, 33, 40);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Pink Accent Bar
  doc.setFillColor(255, 77, 109); 
  doc.rect(0, 50, 210, 4, 'F');

  // Overlay Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('FINANCIAL LEDGER', 16, 32);

  doc.setTextColor(255, 77, 109);
  doc.setFontSize(28);
  doc.text('REPORT', 145, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 230);
  doc.text(`GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 16, 42);
  doc.text(`RECORD COUNT: ${transactions.length} ITEMS`, 145, 42);

  // Summary Table
  const tableData = transactions.map((t, idx) => [
    idx + 1,
    t.propertyName || 'N/A',
    t.date || 'N/A',
    t.guestName || 'N/A',
    `INR ${t.amount?.toLocaleString('en-IN') || 0}`,
    t.status?.toUpperCase() || 'N/A'
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['SL.', 'Property', 'Date', 'Guest', 'Amount', 'Status']],
    body: tableData,
    headStyles: { 
      fillColor: [240, 242, 245], 
      textColor: [31, 33, 40], 
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: { fontSize: 8, cellPadding: 4, halign: 'left', valign: 'middle' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left' },
      2: { halign: 'left' },
      3: { halign: 'left' },
      4: { halign: 'right' },
      5: { halign: 'left' }
    },
    theme: 'plain',
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(240);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  const footerY = 285;
  doc.text('StayCool Booking - Confidential Financial report', 105, footerY, { align: 'center' });

  doc.save(`StayCool_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
};
