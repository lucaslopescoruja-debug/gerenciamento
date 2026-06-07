import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// Date formatters
function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return 'Não registrada'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function formatDateOnly(dateStr: string | undefined) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date)
}

export async function generateDeliveryProofPDF(client: any, company: any): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let y = 15

  // Header - Title & Brand (Company name & CNPJ)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14) // large font for company name
  doc.setTextColor(79, 70, 229) // Brand color (indigo-600)
  const compNameText = company?.name || 'Empresa Emissora'
  const compNameLines = doc.splitTextToSize(compNameText, 120)
  doc.text(compNameLines, 15, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.text('COMPROVANTE DE ENTREGA', 195, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text(`Pedido: ${client.order_number || 'Sem número'}`, 195, y + 5, { align: 'right' })

  let cnpjY = y + (compNameLines.length * 5)
  if (company?.cnpj) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // Slate-600
    doc.text(`CNPJ: ${company.cnpj}`, 15, cnpjY)
    cnpjY += 5
  }

  y = Math.max(cnpjY, y + 10)
  doc.setDrawColor(226, 232, 240) // border-slate-200
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)

  y += 8

  if (client.status === 'returned') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(220, 38, 38) // red-600
    const reasonText = client.return_reason ? `PEDIDO RETORNADO - Motivo: ${client.return_reason}` : 'PEDIDO RETORNADO'
    const reasonLines = doc.splitTextToSize(reasonText, 180)
    doc.text(reasonLines, 15, y)
    y += (reasonLines.length * 5) + 3
  }

  // DADOS DO CLIENTE
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('DADOS DO CLIENTE', 15, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  const clientNameText = client.name || 'Cliente Sem Nome'
  const nameLines = doc.splitTextToSize(clientNameText, 180)
  doc.text(nameLines, 15, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105) // Slate-600
  const addrText = client.address || 'Endereço não informado'
  const addrLines = doc.splitTextToSize(addrText, 180)
  
  const addrStartY = y + 6 + (nameLines.length * 5)
  doc.text(addrLines, 15, addrStartY)

  y = addrStartY + (addrLines.length * 5) + 2
  doc.setLineWidth(0.2)
  doc.line(15, y, 195, y)
  y += 8

  // Items Table Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Cód. Produto', 15, y)
  doc.text('Descrição do Item', 45, y)
  doc.text('Conferido / Esperado', 195, y, { align: 'right' })

  y += 3
  doc.setLineWidth(0.2)
  doc.line(15, y, 195, y)
  y += 7

  // Items List
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)

  const items = client.delivery_items || []
  for (const item of items) {
    // Check if we need to wrap page
    if (y > 260) {
      doc.addPage()
      y = 20
      
      // Draw minimal header on new page
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Cód. Produto', 15, y)
      doc.text('Descrição do Item', 45, y)
      doc.text('Conferido / Esperado', 195, y, { align: 'right' })
      y += 3
      doc.line(15, y, 195, y)
      y += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(15, 23, 42)
    }

    doc.setFont('helvetica', 'bold')
    doc.text(item.product_code || '', 15, y)
    doc.setFont('helvetica', 'normal')
    
    // Split description if it's too long
    const descLines = doc.splitTextToSize(item.description || '', 110)
    if (item.quantity_scanned < item.quantity_expected && item.return_reason) {
      const reasonLines = doc.splitTextToSize(`Motivo da Falta: ${item.return_reason}`, 110)
      descLines.push(...reasonLines)
    }
    doc.text(descLines, 45, y)
    
    // Print quantities
    const qtyText = `${item.quantity_scanned || 0} / ${item.quantity_expected || 0}`
    doc.setFont('helvetica', 'bold')
    doc.text(qtyText, 195, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    const descHeight = descLines.length * 5
    y += Math.max(7, descHeight)
  }

  y += 5
  doc.setLineWidth(0.3)
  doc.line(15, y, 195, y)
  y += 10

  // Verification Box / Receiver & Signature Info
  // If box goes out of page bounds, add page
  if (y > 220) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252) // background light-gray
  doc.rect(15, y, 180, 52, 'FD')

  // Inside Box Details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('NOME DO RECEBEDOR', 20, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(client.receiver_name || 'Não informado', 20, y + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('DOCUMENTO (RG/CPF)', 20, y + 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(client.receiver_doc || 'Não informado', 20, y + 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('DATA / HORA DA ENTREGA', 20, y + 38)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(formatDateTime(client.signed_at || client.updated_at), 20, y + 43)

  // Signature image
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('ASSINATURA DIGITAL DO CLIENTE', 110, y + 8)

  if (client.signature_data) {
    try {
      // Add signature print
      doc.addImage(client.signature_data, 'PNG', 110, y + 11, 75, 34)
    } catch (err) {
      console.error('Error rendering signature to PDF', err)
      doc.text('[Erro ao processar imagem de assinatura]', 110, y + 25)
    }
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text('Assinatura não coletada pelo motorista.', 110, y + 25)
  }

  // Footer page number or metadata
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Comprovante gerado eletronicamente pelo sistema Estoque Fácil WMS.', 15, 287)

  // Output file based on environment
  const filename = `comprovante_${client.order_number || client.id}.pdf`
  if (Capacitor.isNativePlatform()) {
    try {
      // Get base64 representation of PDF
      const pdfOutput = doc.output('datauristring')
      const base64Data = pdfOutput.split(',')[1]

      // Save file to Cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      })

      // Share PDF using native Share sheets
      await Share.share({
        title: `Comprovante - ${client.name}`,
        text: `Segue comprovante de entrega do pedido ${client.order_number || ''}`,
        url: result.uri,
        dialogTitle: 'Compartilhar Comprovante'
      })
    } catch (error: any) {
      console.error('Error sharing native file', error)
      throw new Error(`Erro ao compartilhar PDF no celular: ${error.message}`)
    }
  } else {
    // Normal browser download
    doc.save(filename)
  }
}
