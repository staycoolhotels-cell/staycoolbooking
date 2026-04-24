import { Transaction } from './types';

export const generateInvoicePDF = async (t: Transaction) => {
  // Use dynamic import for client-side libraries
  const { jsPDF } = await import('jspdf');
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
  doc.text(title, isRefund ? 115 : 145, 30);

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
  doc.text(`${invoiceId}`, 158, 76);
  doc.text(`${t.date || new Date().toLocaleDateString()}`, 158, 83);

  // 3. Table - Matches requested clean modern style
  const breakdown = t.breakdown || {
    accommodation: (t.amount || 0) * 0.88,
    service_fee: (t.amount || 0) * 0.10,
    taxes: (t.amount || 0) * 0.02
  };

  autoTable(doc, {
    startY: 110,
    head: [['SL.', 'Item Description', 'Price', 'Qty.', 'Total']],
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
      3: { halign: 'center', cellWidth: 15 },
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

  // 4. Footer Summary & Info
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for choosing STAY COOL', 16, finalY);

  doc.setFontSize(9);
  doc.text('Payment Info:', 16, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Account #:   1234 5678 9012', 16, finalY + 16);
  doc.text('A/C Name:    STAYCOOL PVT LTD', 16, finalY + 21);
  doc.text('Bank Details: Add your details', 16, finalY + 26);

  // Financial Breakdown on Right
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

  // Terms & Signature
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 16, finalY + 45);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.setFontSize(7);
  const terms = "1. Guest is responsible for property condition. 2. Cancellations must be made 72 hours prior for full refund. 3. StayCool is a platform provider and not a party to the stay contract. 4. Luxury services subject to availability.";
  doc.text(terms, 16, finalY + 50, { maxWidth: 80 });

  doc.setDrawColor(31, 33, 40);
  doc.line(140, 275, 195, 275);
  doc.setTextColor(31, 33, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorised Sign', 167, 280, { align: 'center' });

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

export const exportTransactionsToPDF = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return;

  const { jsPDF } = await import('jspdf');
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
