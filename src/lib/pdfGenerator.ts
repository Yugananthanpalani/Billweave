import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Bill } from '../types'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

interface ShopInfo {
  shopName: string
  email: string
}

/* ===== LOAD LOGO AS BASE64 ===== */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => resolve(img)
    img.onerror = reject
  })

export const generatePDF = async (
  bill: Bill,
  shopInfo: ShopInfo,
  action: 'download' | 'print' | 'share' = 'download'
) => {
  const doc = new jsPDF()
  const pageHeight = doc.internal.pageSize.height

  /* ================= LOGO (CENTER, TRANSPARENT) ================= */
  try {
    const logo = await loadImage('/icons/lo.png')

    const logoWidth = 60   // small size
    const logoHeight = 60
    const centerX = (200 - logoWidth) / 2
    const centerY = 150     // middle of bill

    // @ts-ignore – jsPDF supports opacity
    doc.setGState(new (doc as any).GState({ opacity: 0.5 }))

    doc.addImage(
      logo,
      'PNG',
      centerX,
      centerY,
      logoWidth,
      logoHeight
    )

    // reset opacity
    // @ts-ignore
    doc.setGState(new (doc as any).GState({ opacity: 1 }))
  } catch (e) {
    console.warn('Logo not loaded')
  }

  /* ================= HEADER ================= */
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(shopInfo.shopName, 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Email: ${shopInfo.email}`, 105, 28, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(20, 32, 190, 32)

  /* ================= BILL INFO ================= */
  doc.setFontSize(11)
  doc.text(`Bill No: ${bill.billNumber}`, 20, 42)
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 20, 48)
  doc.text(`Customer: ${bill.customerName}`, 20, 54)
  doc.text(`Phone: ${bill.customerPhone}`, 20, 60)

  /* ================= ITEMS TABLE ================= */
  autoTable(doc, {
    startY: 70,
    head: [['Item', 'Qty', 'Price(Rs.)', 'Amount(Rs.)']],
    body: bill.items.map(i => [
      i.name ?? '',
      i.quantity.toString(),
      i.price.toFixed(2),
      i.total.toFixed(2)
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 58 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 51 },
      3: { halign: 'right', cellWidth: 51 }
    },
    didParseCell: (data: any) => {
      if (data.section === 'head') {
        data.cell.styles.halign =
          data.column.index === 0
            ? 'left'
            : data.column.index === 1
            ? 'center'
            : 'right'
      }

      if (
        data.section === 'body' &&
        data.column.index === 3 &&
        data.row.index === bill.items.length - 1
      ) {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  const tableEndY = (doc as any).lastAutoTable.finalY

  /* ================= TOTALS ================= */
  const labelX = 130
  const amountX = 190
  let totalsY = tableEndY + 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  doc.text('Subtotal:', labelX, totalsY)
  doc.text(`Rs.${bill.subtotal.toFixed(2)}`, amountX, totalsY, { align: 'right' })

  totalsY += 8
  doc.text(`GST (${bill.taxPercentage}%):`, labelX, totalsY)
  doc.text(`${bill.tax.toFixed(2)}`, amountX, totalsY, { align: 'right' })

  totalsY += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', labelX, totalsY)
  doc.text(`Rs.${bill.total.toFixed(2)}`, amountX, totalsY, { align: 'right' })

  /* ================= FOOTER ================= */
  const footerY = pageHeight - 20

  doc.setFontSize(10)
  doc.text('Thank You for your Business..!', 105, footerY, { align: 'center' })

  doc.setFontSize(9)
  doc.text(
    'This bill is generated @ BillWeave',
    105,
    footerY + 6,
    { align: 'center' }
  )

  /* ================= PLATFORM ================= */
  const isAndroid = Capacitor.getPlatform() === 'android'

  if (!isAndroid) {
    if (action === 'print') {
      doc.autoPrint()
      window.open(doc.output('bloburl'))
    } else {
      doc.save(`BillWeave_${bill.billNumber}.pdf`)
    }
    return
  }

  const base64 = doc.output('datauristring').split(',')[1]
  const fileName = `BillWeave_${bill.billNumber}.pdf`

  const file = await Filesystem.writeFile({
    path: `BillWeave/${fileName}`,
    data: base64,
    directory: Directory.Documents,
    recursive: true
  })

  if (action === 'share') {
    await Share.share({
      title: 'BillWeave Invoice',
      text: `Invoice ${bill.billNumber}`,
      url: file.uri
    })
  }
}
