import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, User } from '../types';

// Generate PDF and return as blob for sharing
export const generatePDFBlob = (
  bill: Bill,
  shopInfo: { shopName: string; name: string; phone: string; email: string }
): Blob => {
  const doc = new jsPDF();

  /* ================= HEADER ================= */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(shopInfo.shopName, 20, 20, { align: 'left' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(shopInfo.phone, 20, 28, { align: 'left' });
  doc.text(`Email: ${shopInfo.email}`, 20, 34, { align: 'left' });
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  /* ================= INVOICE INFO ================= */
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill Number: ${bill.billNumber}`, 20, 56);
  doc.text(
    `Date: ${new Date(bill.createdAt).toLocaleDateString()}`,
    20,
    62
  );

  /* ================= CUSTOMER ================= */
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 74);

  doc.setFont('helvetica', 'normal');
  doc.text(bill.customerName, 20, 80);
  doc.text(`Phone: ${bill.customerPhone}`, 20, 86);

  /* ================= TABLE ================= */
  const tableData = bill.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `Rs. ${item.price.toFixed(2)}`,
    `Rs. ${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 96,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',

    headStyles: {
      fillColor: [107, 114, 128],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 2,
      halign: 'center',
    },

    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },

    columnStyles: {
      0: { cellWidth: 80, halign: 'left', cellPadding: 3 },
      1: { cellWidth: 25, halign: 'center', cellPadding: 3 },
      2: { cellWidth: 35, halign: 'right', cellPadding: 3 },
      3: { cellWidth: 35, halign: 'right', cellPadding: 3 },
    },

    margin: { left: 20, right: 20 },

    didParseCell: function(data: any) {
      if (data.column.index === 0 && data.cell.text.length > 0) {
        data.cell.styles.cellWidth = 80;
        data.cell.styles.overflow = 'linebreak';
      }
    },
    
    didDrawCell: function(data: any) {
      if (data.column.index === 0 && data.row.index > 0) {
        data.cell.height = Math.max(data.cell.height, 12);
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  /* ================= TOTALS ================= */
  const rightX = 190;
  const labelX = rightX - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Subtotal:', labelX, finalY, { align: 'right' });
  doc.text(`Rs. ${bill.subtotal.toFixed(2)}`, rightX, finalY, {
    align: 'right',
  });

  doc.text(
    `GST (${bill.taxPercentage}%):`,
    labelX,
    finalY + 6,
    { align: 'right' }
  );
  doc.text(`${bill.tax.toFixed(2)}`, rightX, finalY + 6, {
    align: 'right',
  });

  doc.line(labelX - 5, finalY + 9, rightX, finalY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', labelX, finalY + 16, { align: 'right' });
  doc.text(`Rs. ${bill.total.toFixed(2)}`, rightX, finalY + 16, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0,0,0); // Green color for paid amount
  doc.text('Amount Paid:', labelX, finalY + 24, { 
    align: 'right', 
  });

  doc.setTextColor(34, 197, 94); // Green color for paid amount
  doc.text(
    `Rs. ${bill.amountPaid.toFixed(2)}`,
    rightX,
    finalY + 24,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0,0,0); // Red color for due amount
  doc.text('Amount Due:', labelX, finalY + 32, {
    align: 'right',
  });
  doc.setTextColor(220, 38, 38); // Red color for due amount
  doc.text(
    `Rs. ${bill.amountDue.toFixed(2)}`,
    rightX,
    finalY + 32,
    { align: 'right' }
  );

  /* ================= WATERMARK LOGO ================= */
const logoUrl = "/icons/log.png";
const logoSize = 80;

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

const centerX = (pageWidth - logoSize) / 2;
const centerY = (pageHeight - logoSize) / 2;

// Set transparency (opacity)
doc.setGState(new (doc as any).GState({ opacity: 0.15 }));

doc.addImage(
  logoUrl,
  "PNG",
  centerX,
  centerY,
  logoSize,
  logoSize
);

// Reset opacity back to normal
doc.setGState(new (doc as any).GState({ opacity: 1 }));

  /* ================= FOOTER ================= */
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Thank you for choosing ${shopInfo.shopName}!`,
    105,
    280,
    { align: 'center' }
  );
  doc.text(
    `This Bill Generated and Verified by BillWeave`,
    105,
    285,
    { align: 'center' }
  );

  // Return PDF as blob
  return doc.output('blob');
};

export const generatePDF = (
  bill: Bill,
  shopInfo: { shopName: string; name: string; phone: string; email: string },
  action: 'download' | 'print' = 'download'
) => {
  const doc = new jsPDF();

  /* ================= HEADER ================= */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(shopInfo.shopName, 20, 20, { align: 'left' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(shopInfo.phone, 20, 28, { align: 'left' });
  doc.text(`Email: ${shopInfo.email}`, 20, 34, { align: 'left' });
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  /* ================= INVOICE INFO ================= */
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill Number: ${bill.billNumber}`, 20, 56);
  doc.text(
    `Date: ${new Date(bill.createdAt).toLocaleDateString()}`,
    20,
    62
  );

  /* ================= CUSTOMER ================= */
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 74);

  doc.setFont('helvetica', 'normal');
  doc.text(bill.customerName, 20, 80);
  doc.text(`Phone: ${bill.customerPhone}`, 20, 86);

  /* ================= TABLE ================= */
  const tableData = bill.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `Rs. ${item.price.toFixed(2)}`,
    `Rs. ${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 96,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',

    headStyles: {
      fillColor: [107, 114, 128],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 2,
      halign: 'center',
    },

    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },

    columnStyles: {
      0: { cellWidth: 80, halign: 'left', cellPadding: 3 },   // Item
      1: { cellWidth: 25, halign: 'center', cellPadding: 3 }, // Qty
      2: { cellWidth: 35, halign: 'right', cellPadding: 3 },  // Price
      3: { cellWidth: 35, halign: 'right', cellPadding: 3 },  // Total
    },

    margin: { left: 20, right: 20 },
    
    // Ensure each item appears on a separate row
    didParseCell: function(data: any) {
      // Force text wrapping for item names if they're too long
      if (data.column.index === 0 && data.cell.text.length > 0) {
        data.cell.styles.cellWidth = 80;
        data.cell.styles.overflow = 'linebreak';
      }
    },
    
    // Add some spacing between rows
    didDrawCell: function(data: any) {
      if (data.column.index === 0 && data.row.index > 0) {
        // Add a small gap between items for better readability
        data.cell.height = Math.max(data.cell.height, 12);
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  /* ================= TOTALS ================= */
  const rightX = 190;
  const labelX = rightX - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Subtotal:', labelX, finalY, { align: 'right' });
  doc.text(`Rs. ${bill.subtotal.toFixed(2)}`, rightX, finalY, {
    align: 'right',
  });

  doc.text(
    `GST (${bill.taxPercentage}%):`,
    labelX,
    finalY + 6,
    { align: 'right' }
  );
  doc.text(`${bill.tax.toFixed(2)}`, rightX, finalY + 6, {
    align: 'right',
  });

  doc.line(labelX - 5, finalY + 9, rightX, finalY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', labelX, finalY + 16, { align: 'right' });
  doc.text(`Rs. ${bill.total.toFixed(2)}`, rightX, finalY + 16, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Green color for paid amount
  doc.text('Amount Paid:', labelX, finalY + 28, {
    align: 'right',
  });
  doc.setTextColor(34, 197, 94); // Green color for paid amount
  doc.text(
    `Rs. ${bill.amountPaid.toFixed(2)}`,
    rightX,
    finalY + 28,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Red color for due amount
  doc.text('Amount Due:', labelX, finalY + 36, {
    align: 'right',
  });
  doc.setTextColor(220, 38, 38); // Red color for due amount
  doc.text(
    `Rs. ${bill.amountDue.toFixed(2)}`,
    rightX,
    finalY + 36,
    { align: 'right' }
  );

  /* ================= WATERMARK LOGO ================= */
const logoUrl = "/icons/log.png";
const logoSize = 80;

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

const centerX = (pageWidth - logoSize) / 2;
const centerY = (pageHeight - logoSize) / 2;

// Set transparency (opacity)
doc.setGState(new (doc as any).GState({ opacity: 0.15 }));

doc.addImage(
  logoUrl,
  "PNG",
  centerX,
  centerY,
  logoSize,
  logoSize
);

// Reset opacity back to normal
doc.setGState(new (doc as any).GState({ opacity: 1 }));


  /* ================= FOOTER ================= */
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Thank you for choosing ${shopInfo.shopName}!`,
    105,
    280,
    { align: 'center' }
  );
  doc.text(
    `Generated by BillWeave - Professional Tailor Management System`,
    105,
    285,
    { align: 'center' }
  );

  /* ================= ACTION ================= */
  if (action === 'download') {
    doc.save(`${bill.billNumber}.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};