import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill } from '../types';

export const generatePDF = (
  bill: Bill,
  action: 'download' | 'print' = 'download'
) => {
  const doc = new jsPDF();

  /* ================= HEADER ================= */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('BillWeave', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Tailor Shop Billing System', 105, 28, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  /* ================= INVOICE INFO ================= */
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill Number: ${bill.billNumber}`, 20, 50);
  doc.text(
    `Date: ${new Date(bill.createdAt).toLocaleDateString()}`,
    20,
    56
  );

  /* ================= CUSTOMER ================= */
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 68);

  doc.setFont('helvetica', 'normal');
  doc.text(bill.customerName, 20, 74);
  doc.text(`Phone: ${bill.customerPhone}`, 20, 80);

  /* ================= TABLE ================= */
  const tableData = bill.items.map((item) => [
    item.name,
    item.quantity.toString(),
    `Rs. ${item.price.toFixed(2)}`,
    `Rs. ${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',

    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2,
      halign: 'center',
    },

    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      valign: 'middle',
    },

    columnStyles: {
      0: { cellWidth: 70, halign: 'left' },   // Item LEFT
      1: { cellWidth: 20, halign: 'center' }, // Qty
      2: { cellWidth: 40, halign: 'right' },  // Price
      3: { cellWidth: 40, halign: 'right' },  // Total
    },

    margin: { left: 20, right: 20 },
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

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Amount Paid:', labelX, finalY + 24, {
    align: 'right',
  });
  doc.text(
    `Rs. ${bill.amountPaid.toFixed(2)}`,
    rightX,
    finalY + 24,
    { align: 'right' }
  );

  /* ================= PAYMENT STATUS ================= */
  const statusY = finalY + 40;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', 20, statusY);

  let statusColor: [number, number, number] = [107, 114, 128];
  if (bill.paymentStatus === 'paid') statusColor = [34, 197, 94];
  if (bill.paymentStatus === 'pending') statusColor = [239, 68, 68];
  if (bill.paymentStatus === 'partial') statusColor = [234, 179, 8];

  doc.setTextColor(...statusColor);
  doc.text(bill.paymentStatus.toUpperCase(), 55, statusY);
  doc.setTextColor(0, 0, 0);

  /* ================= FOOTER ================= */
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Thank you for your business!',
    105,
    280,
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
