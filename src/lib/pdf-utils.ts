import { Transaction } from './types';

export const generateInvoicePDF = async (t: Transaction) => {
  // Use UMD import for better compatibility with Next.js dynamic chunks
  const jspdfModule = await import('jspdf/dist/jspdf.umd.min.js') as any;
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const isRefund = t.type === 'refund';
  const isPendingPayment = t.status === 'pending_payment' || t.status === 'payment_failed';
  const invoiceId = t.invoice_id || (t.id ? t.id.split('-')[0].toUpperCase() : 'N/A');

  // 1. Dark Header & Accent Bar
  doc.setFillColor(31, 33, 40); // Charcoal Black
  doc.rect(0, 0, 210, 50, 'F');
  
  // Accent Bar (Sky Blue normally, Amber if pending, Rose if refund)
  if (isRefund) {
    doc.setFillColor(225, 29, 72);
  } else if (isPendingPayment) {
    doc.setFillColor(245, 158, 11);
  } else {
    doc.setFillColor(14, 165, 233);
  }
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

  if (isRefund) {
    doc.setTextColor(225, 29, 72);
  } else if (isPendingPayment) {
    doc.setTextColor(245, 158, 11);
  } else {
    doc.setTextColor(14, 165, 233);
  }
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  const title = isRefund ? 'REFUND INVOICE' : isPendingPayment ? 'PROFORMA INVOICE' : 'TAX INVOICE';
  doc.text(title, 194, 28, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  const subTitle = isRefund 
    ? 'CREDIT NOTE & CANCELLATION SETTLEMENT' 
    : isPendingPayment 
      ? 'AWAITING PAYMENT - NOT A TAX RECEIPT' 
      : 'OFFICIAL ACCOMMODATION RECEIPT';
  doc.text(subTitle, 194, 34, { align: 'right' });

  // 2. Info Section (Modern Light Card Design)
  const breakdown = t.breakdown || {
    accommodation: Math.round((t.amount || 0) / 1.1),
    service_fee: Math.round((t.amount || 0) * 0.1 / 1.1),
    taxes: 0,
    discount: 0,
    upgrades: 0,
    cancellation_fee: 0
  };

  const nights = t.nights || 1;
  const originalTotal = t.amount || 0;
  const netRefundablePool = t.netRefundablePool !== undefined ? t.netRefundablePool : (breakdown.accommodation || Math.round(originalTotal / 1.1));
  const refundPercent = t.refundPercentage !== undefined ? t.refundPercentage : (netRefundablePool > 0 && t.refundAmount !== undefined ? Math.round((t.refundAmount / netRefundablePool) * 100) : 50);
  const eligibleRefund = Math.round((netRefundablePool * refundPercent) / 100);
  const retainedPenalty = t.retainedPenalty !== undefined ? t.retainedPenalty : Math.max(0, netRefundablePool - eligibleRefund);
  const retainedServiceFee = t.retainedServiceFee !== undefined ? t.retainedServiceFee : (breakdown.service_fee || Math.round(originalTotal * 0.1 / 1.1));
  const protectionFee = breakdown.cancellation_fee || 0;
  const totalRetained = retainedPenalty + retainedServiceFee + protectionFee;
  const finalRefundAmount = t.refundAmount !== undefined ? t.refundAmount : Math.max(0, originalTotal - totalRetained);

  // Exact 3-Way Distribution values
  const guestRefund = t.guestRefundAmount !== undefined 
    ? t.guestRefundAmount 
    : (t.refundAmount !== undefined ? t.refundAmount : finalRefundAmount);

  const hostShare = t.hostShare !== undefined 
    ? t.hostShare 
    : Math.round(retainedPenalty / 2);

  const adminShare = t.adminShare !== undefined 
    ? t.adminShare 
    : Math.max(0, originalTotal - guestRefund - hostShare);

  const hostPayout = t.hostPayoutAmount !== undefined 
    ? t.hostPayoutAmount 
    : Math.max(0, Math.round((originalTotal - (breakdown.service_fee || Math.round(originalTotal * 0.1 / 1.1))) * 0.90));

  const adminRevenue = t.adminCommissionAmount !== undefined 
    ? t.adminCommissionAmount 
    : Math.max(0, originalTotal - hostPayout);

  const guestName = t.guestName || 'Valued Guest';
  const addressLines = (t.guestAddress || '').split('\n').map(s => s.trim()).filter(Boolean);
  const guestEmail = t.guestEmail || addressLines.find(l => l.includes('@')) || '';
  const guestPhone = t.guestPhone || addressLines.find(l => /^[+\d\s()-]{8,}$/.test(l)) || '';
  const guestLocation = t.guestLocation || addressLines.find(l => !l.includes('@') && !/^[+\d\s()-]{8,}$/.test(l)) || '';

  const hostName = t.hostName || 'StayCool Host';
  const hostEmail = t.hostEmail || '';
  const hostPhone = t.hostPhone || '';
  const propertyName = t.propertyName || 'StayCool Property';
  const propertyLocation = t.propertyLocation || '';
  const propertyAddress = t.propertyAddress || propertyLocation;

  // Pre-calculate heights to draw dynamic card background
  let leftY = 65;
  let rightY = 65;

  // Measure left side (Guest & Host Details)
  leftY += 5.5 + 4.5; // Guest header + Name
  if (guestEmail) leftY += 4;
  if (guestPhone) leftY += 4;
  if (guestLocation) leftY += 4;
  if (!guestEmail && !guestPhone && t.guestAddress) {
    const rawAddrLines = doc.splitTextToSize(t.guestAddress, 95);
    leftY += rawAddrLines.length * 4;
  }
  leftY += 2 + 5 + 4; // Host header + Name
  if (hostEmail) leftY += 4;
  if (hostPhone) leftY += 4;
  leftY += 4; // Property title
  if (propertyAddress || propertyLocation) {
    const pAddrLines = doc.splitTextToSize(`Address: ${propertyAddress || propertyLocation}`, 95);
    leftY += pAddrLines.length * 4;
  }

  // Measure right side (Invoice & Stay metadata)
  rightY += 6; // Header
  rightY += 4.5; // Invoice#
  rightY += 4.5; // Date
  if (t.bookingDate) rightY += 4.5;
  if (t.checkIn && t.checkOut) rightY += 4.5;
  if (t.nights) rightY += 4.5;
  if (t.paymentMethod) rightY += 4.5;
  rightY += 4.5; // Status
  if (isRefund) {
    if (t.cancellationDate) rightY += 4.5;
    if (t.daysBeforeCheckIn !== undefined) rightY += 4.5;
    if (t.appliedPolicy) rightY += 4.5;
  }

  const infoEndY = Math.max(leftY, rightY) + 6;
  const infoHeight = Math.max(56, infoEndY - 54);

  // Render info box background
  doc.setFillColor(250, 252, 254);
  doc.rect(0, 54, 210, infoHeight, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(0, 54 + infoHeight, 210, 54 + infoHeight);

  // Left accent bar
  doc.setFillColor(14, 165, 233);
  doc.rect(16, 60, 2, infoHeight - 12, 'F');

  // Left Column - Full Guest & Host Details
  let curLeft = 65;
  doc.setTextColor(14, 165, 233);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('GUEST DETAILS (BILLED TO)', 22, curLeft);
  curLeft += 5.5;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(guestName, 22, curLeft);
  curLeft += 4.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  if (guestEmail) {
    doc.text(`Email: ${guestEmail}`, 22, curLeft);
    curLeft += 4;
  }
  if (guestPhone) {
    doc.text(`Phone: ${guestPhone}`, 22, curLeft);
    curLeft += 4;
  }
  if (guestLocation) {
    doc.text(`City / Location: ${guestLocation}`, 22, curLeft);
    curLeft += 4;
  }
  if (!guestEmail && !guestPhone && t.guestAddress) {
    const rawAddrLines = doc.splitTextToSize(t.guestAddress, 95);
    doc.text(rawAddrLines, 22, curLeft);
    curLeft += rawAddrLines.length * 4;
  }

  // Host & Property Details Section
  curLeft += 2.5;
  doc.setTextColor(14, 165, 233);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('HOST & PROPERTY DETAILS', 22, curLeft);
  curLeft += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(hostName, 22, curLeft);
  curLeft += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (hostEmail) {
    doc.text(`Host Email: ${hostEmail}`, 22, curLeft);
    curLeft += 4;
  }
  if (hostPhone) {
    doc.text(`Host Phone: ${hostPhone}`, 22, curLeft);
    curLeft += 4;
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Property: ${propertyName}`, 22, curLeft);
  curLeft += 4;
  if (propertyAddress || propertyLocation) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const pAddrLines = doc.splitTextToSize(`Address: ${propertyAddress || propertyLocation}`, 95);
    doc.text(pAddrLines, 22, curLeft);
    curLeft += pAddrLines.length * 4;
  }

  // Right Column - References & Dates
  let curRight = 65;
  doc.setTextColor(14, 165, 233);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE & BOOKING REFERENCE', 130, curRight);
  curRight += 6;

  const renderRefLine = (label: string, value: string, isHighlighted = false, color?: number[]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color ? color[0] : 71, color ? color[1] : 85, color ? color[2] : 105);
    doc.text(label, 130, curRight);
    doc.setFont('helvetica', isHighlighted ? 'bold' : 'normal');
    if (color) {
      doc.setTextColor(color[0], color[1], color[2]);
    } else {
      doc.setTextColor(isHighlighted ? 15 : 100, isHighlighted ? 23 : 116, isHighlighted ? 42 : 139);
    }
    doc.text(value, 165, curRight);
    curRight += 4.5;
  };

  renderRefLine('Invoice Number:', `#${invoiceId}`, true);
  renderRefLine('Invoice Date:', `${t.date || new Date().toLocaleDateString()}`);
  if (t.bookingDate) renderRefLine('Booking Date:', `${t.bookingDate}`);
  if (t.checkIn && t.checkOut) renderRefLine('Stay Period:', `${t.checkIn} - ${t.checkOut}`);
  if (t.nights) renderRefLine('Total Duration:', `${nights} ${nights === 1 ? 'Night' : 'Nights'}`);
  renderRefLine('Status:', isRefund ? 'REFUNDED' : 'CONFIRMED / PAID', true, isRefund ? [225, 29, 72] : [16, 185, 129]);

  if (isRefund) {
    if (t.cancellationDate) renderRefLine('Cancelled On:', `${t.cancellationDate}`, false, [239, 68, 68]);
    if (t.daysBeforeCheckIn !== undefined) renderRefLine('Cancellation Lead:', `${t.daysBeforeCheckIn} Days Before Check-in`, false, [217, 119, 6]);
    if (t.appliedPolicy) renderRefLine('Policy Applied:', `${t.appliedPolicy}`, true, [14, 165, 233]);
  }

  let tableStartY = 54 + infoHeight + 8;

  // 3. Room Breakdown Section (If available)
  if (t.room_type) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM CONFIGURATION & UNITS', 16, tableStartY);

    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(16, tableStartY + 2, 60, tableStartY + 2);

    const roomItems = (t.room_type || '').split(', ');
    const roomTableBody = roomItems.map((item) => {
      const match = item.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
      if (match) {
        const count = parseInt(match[2]);
        const priceStr = match[3] ? match[3].replace(/,/g, '') : '0';
        const pricePerUnit = parseFloat(priceStr);
        const lineTotal = count * pricePerUnit;

        return [
          match[1],
          match[2],
          match[3] ? `Rs. ${Number(pricePerUnit).toLocaleString('en-IN')}` : 'N/A',
          lineTotal > 0 ? `Rs. ${lineTotal.toLocaleString('en-IN')}` : 'N/A'
        ];
      }
      return [item, '1', '-', '-'];
    });

    autoTable(doc, {
      startY: tableStartY + 5,
      margin: { left: 16, right: 16 },
      head: [['Room Type', 'Units', 'Unit Rate', 'Total']],
      body: roomTableBody,
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [14, 165, 233],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }
      },
      styles: { 
        fontSize: 8.5, 
        textColor: [51, 65, 85],
        cellPadding: 3.5,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      theme: 'plain',
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(241, 245, 249);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.column.index === 0) {
            doc.setFillColor(14, 165, 233);
            doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
          }
        }
      }
    });

    tableStartY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. Primary Booking Charges Table
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isRefund ? 'ORIGINAL BOOKING CHARGES' : 'CHARGES & PAYMENT BREAKDOWN', 16, tableStartY);

  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(16, tableStartY + 2, 60, tableStartY + 2);

  const tableBody = [
    ['Accommodation Charges', `Rs.${Math.round(breakdown.accommodation / nights).toLocaleString('en-IN')}`, `${nights}`, `Rs.${breakdown.accommodation.toLocaleString('en-IN')}`],
    ['Platform Service Fee (10%)', `Rs.${breakdown.service_fee.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.service_fee.toLocaleString('en-IN')}`],
  ];

  if (breakdown.discount && breakdown.discount > 0) {
    tableBody.push(['Bulk Discount Savings', `-Rs.${breakdown.discount.toLocaleString('en-IN')}`, '-', `-Rs.${breakdown.discount.toLocaleString('en-IN')}`]);
  }

  if (breakdown.upgrades && breakdown.upgrades > 0) {
    tableBody.push(['Exclusive Upgrades', `Rs.${breakdown.upgrades.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.upgrades.toLocaleString('en-IN')}`]);
  }

  if (breakdown.cancellation_fee && breakdown.cancellation_fee > 0) {
    tableBody.push(['Cancellation Protection', `Rs.${breakdown.cancellation_fee.toLocaleString('en-IN')}`, '1', `Rs.${breakdown.cancellation_fee.toLocaleString('en-IN')}`]);
  }

  autoTable(doc, {
    startY: tableStartY + 5,
    margin: { left: 16, right: 16 },
    head: [['Item Description', 'Base Price', 'Nights', 'Line Total']],
    body: tableBody,
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [14, 165, 233],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 4,
      valign: 'middle'
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
      cellPadding: 4,
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
        if (data.column.index === 0) {
          doc.setFillColor(14, 165, 233);
          doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
        }
      }
    }
  });

  tableStartY = (doc as any).lastAutoTable.finalY + 8;

  // 5. CANCELLATION & REFUND SETTLEMENT TABLE (When booking is cancelled / refunded)
  if (isRefund) {
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.setFont('helvetica', 'bold');
    doc.text('CANCELLATION & REFUND POLICY SETTLEMENT', 16, tableStartY);

    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.5);
    doc.line(16, tableStartY + 2, 85, tableStartY + 2);

    const settlementRows: any[] = [
      ['Refundable Accommodation Pool', 'Base eligible stay value excluding non-refundable fees', `Rs. ${netRefundablePool.toLocaleString('en-IN')}`],
      ['Policy Refund Eligibility Rate', `${t.appliedPolicy || 'Standard Policy'} (${refundPercent}% tier)`, `Rs. ${eligibleRefund.toLocaleString('en-IN')}`],
      ['Cancellation Charges Retained', 'Retained penalty per cancellation schedule', `-Rs. ${retainedPenalty.toLocaleString('en-IN')}`],
      ['Platform Service Fee (Non-refundable)', 'Retained platform technology & service fee (10%)', `-Rs. ${retainedServiceFee.toLocaleString('en-IN')}`]
    ];

    if (protectionFee > 0) {
      settlementRows.push(['Cancellation Protection Fee', 'Non-refundable coverage fee', `-Rs. ${protectionFee.toLocaleString('en-IN')}`]);
    }

    settlementRows.push(['NET REFUND CREDITED TO GUEST', 'Credited directly to original payment method', `Rs. ${guestRefund.toLocaleString('en-IN')}`]);

    autoTable(doc, {
      startY: tableStartY + 5,
      margin: { left: 16, right: 16 },
      head: [['Settlement Component', 'Policy Reference / Terms', 'Settlement Amount']],
      body: settlementRows,
      headStyles: { 
        fillColor: [255, 241, 242], // rose-50
        textColor: [225, 29, 72], // rose-600
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 4,
        valign: 'middle'
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 8.5,
        cellPadding: 4,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [254, 250, 250]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 65, fontStyle: 'bold' },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      theme: 'plain',
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(254, 226, 226);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          
          // Accent on first column
          if (data.column.index === 0) {
            const isLastRow = data.row.index === settlementRows.length - 1;
            doc.setFillColor(isLastRow ? 16 : 225, isLastRow ? 185 : 29, isLastRow ? 129 : 72);
            doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
          }

          // Highlight final refund amount in green
          if (data.row.index === settlementRows.length - 1 && data.column.index === 2) {
            doc.setTextColor(16, 185, 129); // emerald-600
          }
        }
      }
    });

    tableStartY = (doc as any).lastAutoTable.finalY + 8;

    // 5B. 3-WAY CANCELLATION SETTLEMENT & DISTRIBUTION TABLE
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('3-WAY CANCELLATION SETTLEMENT & DISTRIBUTION', 16, tableStartY);

    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.5);
    doc.line(16, tableStartY + 2, 95, tableStartY + 2);

    const threeWayRefundRows: any[] = [
      ['1. Guest Refund Amount (To Guest)', `Refunded directly to guest (${refundPercent}% of Rs. ${netRefundablePool.toLocaleString('en-IN')} accommodation)`, `${refundPercent}% Refund Tier`, `Rs. ${guestRefund.toLocaleString('en-IN')}`],
      ['2. Host Compensation (To Host)', 'Host compensation for reserved dates cancellation (Rs. 0 from Platform Fee)', '50% Retained Penalty', `Rs. ${hostShare.toLocaleString('en-IN')}`],
      ['3. Admin Platform Retention (To Admin)', `100% Platform Fee (Rs. ${retainedServiceFee.toLocaleString('en-IN')}) + 50% penalty share (Rs. ${hostShare.toLocaleString('en-IN')})`, '100% Fee + Penalty', `Rs. ${adminShare.toLocaleString('en-IN')}`],
      ['Total Reconciled Settlement', '100% of original booking funds accounted for', 'Balanced (100%)', `Rs. ${originalTotal.toLocaleString('en-IN')}`]
    ];

    autoTable(doc, {
      startY: tableStartY + 5,
      margin: { left: 16, right: 16 },
      head: [['Participant / Beneficiary', 'Settlement Nature & Accounting Notes', 'Category / Share', 'Distributed Amount']],
      body: threeWayRefundRows,
      headStyles: { 
        fillColor: [255, 241, 242],
        textColor: [225, 29, 72],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3.5,
        valign: 'middle'
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 8,
        cellPadding: 3.5,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [254, 250, 250]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 38 },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      theme: 'plain',
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(254, 226, 226);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          
          if (data.column.index === 0) {
            const isGuest = data.row.index === 0;
            const isHost = data.row.index === 1;
            const isAdm = data.row.index === 2;
            doc.setFillColor(isGuest ? 16 : isHost ? 217 : isAdm ? 14 : 71, isGuest ? 185 : isHost ? 119 : isAdm ? 165 : 85, isGuest ? 129 : isHost ? 6 : isAdm ? 233 : 105);
            doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
          }

          if (data.column.index === 3) {
            if (data.row.index === 0) doc.setTextColor(16, 185, 129); // emerald-600
            if (data.row.index === 1) doc.setTextColor(217, 119, 6); // amber-600
            if (data.row.index === 2) doc.setTextColor(14, 165, 233); // sky-600
            if (data.row.index === 3) doc.setTextColor(15, 23, 42); // slate-900
          }
        }
      }
    });

    tableStartY = (doc as any).lastAutoTable.finalY + 8;
  } else if (!isPendingPayment) {
    // 5. PAID BOOKINGS — ADMIN SETTLEMENT & 3-WAY REVENUE DISTRIBUTION TABLE
    doc.setFontSize(8);
    doc.setTextColor(14, 165, 233); // sky-600
    doc.setFont('helvetica', 'bold');
    doc.text('ADMIN FINANCIAL SETTLEMENT & 3-WAY DISTRIBUTION', 16, tableStartY);

    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(16, tableStartY + 2, 95, tableStartY + 2);

    const threeWayPaidRows: any[] = [
      ['1. Guest Total Paid (Gross)', 'Total gross amount collected from guest via Razorpay', '100% Gross Billed', `Rs. ${originalTotal.toLocaleString('en-IN')}`],
      ['2. Host Net Payout (To Host)', 'Accommodation & upgrades revenue after 10% platform commission', 'Net Host Payable', `Rs. ${hostPayout.toLocaleString('en-IN')}`],
      ['3. Admin Platform Revenue (To Admin)', '10% Guest Service Fee + 10% Host Commission retained by StayCool', 'Platform Revenue', `Rs. ${adminRevenue.toLocaleString('en-IN')}`],
      ['Total Funds Reconciled', 'Balanced settlement across Guest, Host, and Admin', 'Balanced (100%)', `Rs. ${originalTotal.toLocaleString('en-IN')}`]
    ];

    autoTable(doc, {
      startY: tableStartY + 5,
      margin: { left: 16, right: 16 },
      head: [['Participant / Account', 'Settlement Description & Accounting Notes', 'Distribution Type', 'Settlement Amount']],
      body: threeWayPaidRows,
      headStyles: { 
        fillColor: [240, 249, 255], // sky-50
        textColor: [14, 165, 233], // sky-600
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3.5,
        valign: 'middle'
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 8,
        cellPadding: 3.5,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [250, 252, 255]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 38 },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      theme: 'plain',
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(224, 242, 254);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          
          if (data.column.index === 0) {
            const isGuest = data.row.index === 0;
            const isHost = data.row.index === 1;
            const isAdm = data.row.index === 2;
            doc.setFillColor(isGuest ? 59 : isHost ? 16 : isAdm ? 14 : 71, isGuest ? 130 : isHost ? 185 : isAdm ? 165 : 85, isGuest ? 246 : isHost ? 129 : isAdm ? 233 : 105);
            doc.rect(data.cell.x, data.cell.y + 1, 1, data.cell.height - 2, 'F');
          }

          if (data.column.index === 3) {
            if (data.row.index === 0) doc.setTextColor(59, 130, 246); // blue-600 (guest paid)
            if (data.row.index === 1) doc.setTextColor(16, 185, 129); // emerald-600 (host net payout)
            if (data.row.index === 2) doc.setTextColor(14, 165, 233); // sky-600 (admin revenue)
            if (data.row.index === 3) doc.setTextColor(15, 23, 42); // slate-900 (total)
          }
        }
      }
    });

    tableStartY = (doc as any).lastAutoTable.finalY + 8;
  }

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.height;

  let startFooterY: number;
  if (finalY + 85 > pageHeight) {
    doc.addPage();
    doc.setFillColor(31, 33, 40);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 20, 210, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`INVOICE CONTINUED: #${invoiceId}`, 16, 12);
    startFooterY = 28;
  } else {
    startFooterY = finalY;
  }

  // 6. Footer - Branding & Terms
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'bold');
  doc.text('THANK YOU FOR CHOOSING', 16, startFooterY);
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('STAYCOOL', 16, startFooterY + 8);
  doc.setFontSize(8);
  doc.setTextColor(14, 165, 233); // Sky Blue
  doc.text('PREMIUM HOSPITALITY NETWORK', 16, startFooterY + 13);

  // Financial Summary on Right
  if (isRefund) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Guest Paid:', 130, startFooterY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${originalTotal.toLocaleString('en-IN')}`, 194, startFooterY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(14, 165, 233);
    doc.text('Platform Fee (100% Admin):', 130, startFooterY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${retainedServiceFee.toLocaleString('en-IN')}`, 194, startFooterY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(217, 119, 6);
    doc.text('Payable to Host (Penalty Only):', 130, startFooterY + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${hostShare.toLocaleString('en-IN')}`, 194, startFooterY + 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(14, 165, 233);
    doc.text('Retained by Admin (Fee+Penalty):', 130, startFooterY + 13.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${adminShare.toLocaleString('en-IN')}`, 194, startFooterY + 13.5, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(130, startFooterY + 17.5, 194, startFooterY + 17.5);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Net Refund to Guest:', 130, startFooterY + 23.5);

    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Rs. ${guestRefund.toLocaleString('en-IN')}`, 194, startFooterY + 23.5, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Credited to original payment method', 194, startFooterY + 28.5, { align: 'right' });
  } else if (isPendingPayment) {
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub Total:', 130, startFooterY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${breakdown.accommodation.toLocaleString('en-IN')}`, 194, startFooterY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Platform Service Fee (10%):', 130, startFooterY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${breakdown.service_fee.toLocaleString('en-IN')}`, 194, startFooterY + 6, { align: 'right' });

    if (breakdown.discount && breakdown.discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text('Bulk Discount Savings:', 130, startFooterY + 11);
      doc.setFont('helvetica', 'bold');
      doc.text(`-Rs. ${breakdown.discount.toLocaleString('en-IN')}`, 194, startFooterY + 11, { align: 'right' });
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(130, startFooterY + 14, 194, startFooterY + 14);

    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount Due:', 130, startFooterY + 21);

    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`Rs. ${t.amount.toLocaleString('en-IN')}`, 194, startFooterY + 21, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text('Payment Pending - Not Paid', 194, startFooterY + 26, { align: 'right' });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Paid by Guest:', 130, startFooterY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${originalTotal.toLocaleString('en-IN')}`, 194, startFooterY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('Host Net Payout:', 130, startFooterY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${hostPayout.toLocaleString('en-IN')}`, 194, startFooterY + 5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(14, 165, 233);
    doc.text('Admin Platform Revenue:', 130, startFooterY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${adminRevenue.toLocaleString('en-IN')}`, 194, startFooterY + 10, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(130, startFooterY + 14, 194, startFooterY + 14);

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total Paid:', 130, startFooterY + 20);

    doc.setFontSize(13);
    doc.setTextColor(14, 165, 233); // Sky Blue
    doc.text(`Rs. ${originalTotal.toLocaleString('en-IN')}`, 194, startFooterY + 20, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Payment Completed & Reconciled', 194, startFooterY + 25, { align: 'right' });
  }

  // Terms & Conditions
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 16, startFooterY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.setFontSize(6.5);

  const term1 = "1. The guest is responsible for maintaining property conditions throughout the stay duration.";
  const term2 = "2. Refunds are computed as per the Tiered Cancellation Schedule based on notice prior to check-in.";
  const term3 = "3. StayCool platform service fees are 100% retained by Admin and non-refundable upon cancellation.";
  const term4 = "4. StayCool No-Show Rule: If guest fails to arrive on scheduled check-in date & time, it is treated as a No-Show with no refund, unless applicable policy applies.";
  const term5 = "5. StayCool provides facilitation and is not a direct party to the accommodation contract.";

  const maxW = 105;
  let termY = startFooterY + 28;
  [term1, term2, term3, term4, term5].forEach((term) => {
    const lines = doc.splitTextToSize(term, maxW);
    doc.text(lines, 16, termY);
    termY += lines.length * 3.2 + 0.8;
  });

  // Stamp Badge in PDF
  const stampX = 138;
  const stampY = startFooterY + 28;

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
      doc.addImage(refundStamp, 'PNG', stampX, stampY - 8, 50, 22, undefined, 'FAST', -8);
    } catch {
      // Fallback to text
      doc.setDrawColor(244, 63, 94);
      doc.setTextColor(244, 63, 94);
      doc.setLineWidth(1.5);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.rect(stampX, stampY, 45, 15);
      doc.text('REFUNDED', stampX + 22, stampY + 11, { align: 'center', angle: -8 } as any);
    }
  } else if (isPendingPayment) {
    // UNPAID / PENDING Stamp Badge
    doc.setDrawColor(245, 158, 11);
    doc.setTextColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.rect(stampX, stampY, 48, 16);
    doc.text('UNPAID', stampX + 24, stampY + 11, { align: 'center', angle: -8 } as any);
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
      doc.addImage(paidStamp, 'PNG', stampX, stampY - 8, 50, 22, undefined, 'FAST', -8);
    } catch {
      // Fallback to text
      doc.setDrawColor(16, 185, 129);
      doc.setTextColor(16, 185, 129);
      doc.setLineWidth(1.5);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.rect(stampX, stampY, 45, 15);
      doc.text('PAID', stampX + 22, stampY + 11, { align: 'center', angle: -8 } as any);
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
