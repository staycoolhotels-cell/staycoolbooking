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

  // 2. Info Section (Modern Light Design)
  doc.setFillColor(252, 253, 254);
  doc.rect(0, 54, 210, 45, 'F');

  // Left accent bar for info section
  doc.setFillColor(14, 165, 233);
  doc.rect(16, 68, 1, 15, 'F');

  doc.setTextColor(14, 165, 233);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice to:', 20, 68);
  
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(14);
  doc.text(t.guestName || 'Valued Guest', 20, 76);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (t.guestAddress) {
    const addressLines = doc.splitTextToSize(t.guestAddress, 100);
    doc.text(addressLines, 20, 82);
  } else {
    doc.text('Address not provided', 20, 82);
  }

  doc.setTextColor(31, 33, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice#', 140, 76);
  doc.text('Date:', 140, 83);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
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

  // Room Breakdown Section
  let tableStartY = 110;
  if (t.room_type) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM BREAKDOWN:', 16, 110);
    
    // Add decorative accent line
    doc.setDrawColor(14, 165, 233); // Sky Blue
    doc.setLineWidth(0.5);
    doc.line(16, 112, 45, 112);

    // Parse room_type string into table rows
    // Expected format: "Room Type (Count) ₹Amount, ..."
    const roomItems = (t.room_type || '').split(', ');
    const roomTableBody = roomItems.map((item, idx) => {
      // Regex to extract: Name, Count, Price
      // Example: "Standard Room (2) ₹700" or "Standard Room (2) Rs. 700"
      const match = item.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
      if (match) {
        const count = parseInt(match[2]);
        const priceStr = match[3] ? match[3].replace(/,/g, '') : '0';
        const pricePerUnit = parseFloat(priceStr);
        const lineTotal = count * pricePerUnit;

        return [
          idx + 1,
          match[1], // Room Type
          match[2], // Units
          match[3] ? `Rs. ${Number(pricePerUnit).toLocaleString('en-IN')}` : 'N/A', // Unit Rate
          lineTotal > 0 ? `Rs. ${lineTotal.toLocaleString('en-IN')}` : 'N/A' // Total
        ];
      }
      return [idx + 1, item, '-', '-', '-'];
    });

    autoTable(doc, {
      startY: 115,
      margin: { left: 16, right: 16 },
      head: [['Room Type', 'Units', 'Unit Rate', 'Total']],
      body: roomTableBody.map(row => [row[1], row[2], row[3], row[4]]), // Skip SL. for cleaner look
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [14, 165, 233], // Sky Blue
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }
      },
      styles: { 
        fontSize: 9, 
        textColor: [51, 65, 85], // slate-700
        cellPadding: 4,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      theme: 'plain',
      didDrawCell: (data) => {
        // Draw a very subtle bottom border for each row
        if (data.section === 'body') {
          doc.setDrawColor(241, 245, 249);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          
          // Add a brand-colored vertical accent on the first column
          if (data.column.index === 0) {
            doc.setFillColor(14, 165, 233);
            doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
          }
        }
      }
    });

    tableStartY = (doc as any).lastAutoTable.finalY + 15;
  }

  // 3. Table - Matches requested clean modern style
  const breakdown = t.breakdown || {
    accommodation: Math.round((t.amount || 0) / 1.1),
    service_fee: Math.round((t.amount || 0) * 0.1 / 1.1),
    taxes: 0,
    discount: 0,
    upgrades: 0,
    cancellation_fee: 0
  };

  const tableBody = [
    ['Accommodation Charges', `Rs.${breakdown.accommodation.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.accommodation.toLocaleString('en-IN')}`],
    ['Platform Service Fee (10%)', `Rs.${breakdown.service_fee.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.service_fee.toLocaleString('en-IN')}`],
  ];

  if (breakdown.discount && breakdown.discount > 0) {
    tableBody.push(['Bulk Discount Savings', `-Rs.${breakdown.discount.toLocaleString('en-IN')}`, '1', `-Rs.${breakdown.discount.toLocaleString('en-IN')}`]);
  }

  if (breakdown.upgrades && breakdown.upgrades > 0) {
    tableBody.push(['Exclusive Upgrades', `Rs.${breakdown.upgrades.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.upgrades.toLocaleString('en-IN')}`]);
  }

  if (breakdown.cancellation_fee && breakdown.cancellation_fee > 0) {
    tableBody.push(['Cancellation Protection', `Rs.${breakdown.cancellation_fee.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.cancellation_fee.toLocaleString('en-IN')}`]);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [['Item Description', 'Base Price', 'Nights', 'Line Total']],
    body: tableBody,
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [14, 165, 233], // Sky Blue
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 5,
      valign: 'middle'
    },
    bodyStyles: {
      textColor: [51, 65, 85], // slate-700
      fontSize: 9,
      cellPadding: 6,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253]
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 40, fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    theme: 'plain',
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(241, 245, 249);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        
        // Brand-colored vertical accent on the first column
        if (data.column.index === 0) {
          doc.setFillColor(14, 165, 233);
          doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageHeight = doc.internal.pageSize.height;

  let startFooterY: number;
  if (finalY + 80 > pageHeight) {
    doc.addPage();
    // Re-render minimal header on new page for continuity
    doc.setFillColor(31, 33, 40);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 20, 210, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`INVOICE CONTINUED: ${invoiceId}`, 16, 12);
    startFooterY = 30;
  } else {
    startFooterY = finalY;
  }

  // 4. Footer - Thank you section
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'bold');
  doc.text('THANK YOU FOR YOUR EXPEDITION WITH', 16, startFooterY);
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('STAYCOOL', 16, startFooterY + 10);
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 233); // Sky Blue
  doc.text('PREMIUM HOSPITALITY NETWORK', 16, startFooterY + 16);

  // Financial Breakdown on Right
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Sub Total:', 140, startFooterY);
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isRefund ? 'Total Refund:' : 'Grand Total:', 140, startFooterY + 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 33, 40);
  doc.text(`Rs.${t.amount.toLocaleString('en-IN')}`, 195, startFooterY, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233); // Sky Blue for total
  doc.text(`Rs.${t.amount.toLocaleString('en-IN')}`, 195, startFooterY + 20, { align: 'right' });

  // Divider
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(140, startFooterY + 12, 195, startFooterY + 12);

  // Terms
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 16, startFooterY + 35);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.setFontSize(7);

  const term1 = "The guest is fully responsible for maintaining the property in good condition throughout the duration of their stay.";
  const term2 = "Refunds are processed according to the Tiered Refund Schedule based on cancellation timing relative to check-in.";
  const term3 = "StayCool acts solely as a platform provider and is not a direct party to the accommodation contract between the guest and host.";
  const term4 = "Availability of luxury services and amenities is subject to change without prior notice.";

  const maxW = 100;
  let termY = startFooterY + 41;
  [term1, term2, term3, term4].forEach((term) => {
    const lines = doc.splitTextToSize(term, maxW);
    doc.text(lines, 16, termY);
    termY += lines.length * 4 + 2;
  });

  // Stamp Badge in PDF
  const stampX = 130;
  const stampY = startFooterY + 45;

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
