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

export function drawDeliveryProofOnDoc(doc: jsPDF, client: any, company: any) {

  let y = 15

  // Header - Title & Brand (Company name & CNPJ)
  let cnpjY = y;
  
  if (company?.logo_url) {
    try {
      doc.addImage(company.logo_url, 15, y, 40, 15, undefined, 'FAST')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text('COMPROVANTE DE ENTREGA', 195, y + 5, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105) // Slate-600
      doc.text(`Pedido: ${client.order_number || 'Sem número'}`, 195, y + 10, { align: 'right' })
      
      cnpjY = y + 20
    } catch (e) {
      console.error('Error drawing logo on PDF', e)
      // Fallback
    }
  }

  if (!company?.logo_url || cnpjY === y) {
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

    cnpjY = y + (compNameLines.length * 5)
    if (company?.cnpj) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105) // Slate-600
      doc.text(`CNPJ: ${company.cnpj}`, 15, cnpjY)
      cnpjY += 5
    }
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
  
  let currentY = y + 6 + (nameLines.length * 5)
  
  const clientDoc = client.document || client.customer?.document
  if (clientDoc) {
    // Basic formatting for CNPJ or CPF
    let formattedDoc = clientDoc
    if (formattedDoc.length === 14) {
      formattedDoc = formattedDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    } else if (formattedDoc.length === 11) {
      formattedDoc = formattedDoc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
    }
    doc.text(`CNPJ/CPF: ${formattedDoc}`, 15, currentY)
    currentY += 5
  }

  const addrText = client.address || 'Endereço não informado'
  const addrLines = doc.splitTextToSize(addrText, 180)
  
  const addrStartY = currentY
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
      y = 15
      
      // Draw header with order info on new page
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text('COMPROVANTE DE ENTREGA (Continuação)', 15, y)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text(`Pedido: ${client.order_number || 'Sem número'} | Cliente: ${client.name || ''}`, 15, y + 5)
      
      y += 10
      doc.setLineWidth(0.5)
      doc.line(15, y, 195, y)
      y += 7

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Cód. Produto', 15, y)
      doc.text('Descrição do Item', 45, y)
      doc.text('Conferido / Esperado', 195, y, { align: 'right' })
      y += 3
      doc.setLineWidth(0.2)
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
    y = 15
    
    // Draw header with order info on new page
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('COMPROVANTE DE ENTREGA (Assinatura)', 15, y)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(`Pedido: ${client.order_number || 'Sem número'} | Cliente: ${client.name || ''}`, 15, y + 5)
    
    y += 10
    doc.setLineWidth(0.5)
    doc.line(15, y, 195, y)
    y += 7
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
}

export async function generateDeliveryProofPDF(client: any, company: any): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  drawDeliveryProofOnDoc(doc, client, company)

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

export async function generateContractPDF(order: any, company: any): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let y = 15

  const isRecolha = order.type === 'recolha'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  if (isRecolha) {
    doc.text('TERMO DE RECOLHA DE EQUIPAMENTO', 105, y, { align: 'center' })
  } else {
    doc.text('CONTRATO PARTICULAR DE COMODATO', 105, y, { align: 'center' })
  }
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (!isRecolha) {
    const contractNumber = order.os_number ? `BA${String(order.os_number).padStart(5, '0')}/2026` : 'BA00000/2026'
    doc.text(`Contrato nº ${contractNumber}`, 15, y)
    doc.text(`Patrimônio: ${order.equipment?.patrimony || '______'}`, 195, y, { align: 'right' })
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('PARTES', 15, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    const comodanteText = `COMODANTE: ${company?.name || '______________'}, inscrita no CNPJ sob o número ${company?.cnpj || '______________'}, sediada à ${company?.garage_street || '______________'}, nº. ${company?.garage_number || '___'} ${company?.garage_neighborhood || ''}, ${company?.garage_city || '______________'} - ${company?.garage_state || '___'}, CEP: ${company?.garage_cep || '______________'}.`
    const comodanteLines = doc.splitTextToSize(comodanteText, 180)
    doc.text(comodanteLines, 15, y)
    y += (comodanteLines.length * 5) + 3

    const comodatarioText = `COMODATÁRIO: ${order.customer?.legal_name || order.customer?.fantasy_name || '______________'}, insc.no CNPJ/CPF ${order.customer?.document || '______________'}, ${[order.customer?.address, order.customer?.number, order.customer?.neighborhood, order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}`
    const comodatarioLines = doc.splitTextToSize(comodatarioText, 180)
    doc.text(comodatarioLines, 15, y)
    y += (comodatarioLines.length * 5) + 6

    doc.setFont('helvetica', 'bold')
    doc.text('DAS OBRIGAÇÕES DAS PARTES', 15, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    const obgLines = doc.splitTextToSize(`1º) A parte denominada neste ato COMODANTE cede 01 ${order.equipment?.type || '______________'} ${order.equipment?.model || '______________'}, entregue no endereço do COMODATÁRIO, sem nenhum custo de aluguel para este, devendo o mesmo guardar e zelar do mesmo.

2º) O equipamento cedido em comodato destina-se exclusivamente para o uso e venda dos produtos do COMODANTE, ficando expressamente vedada a sua utilização para produtos de outras marcas, sob pena de imediata rescisão deste contrato.

3º) É dever do COMODATÁRIO conservar o equipamento como se seu fosse, de forma que findo o presente contrato possa devolvê-lo em perfeito estado de conservação e funcionamento, ressalvando o desgaste normal pelo uso.

4º) As obrigações deste contrato são intransferíveis, entendendo que o objeto do comodato deve ficar em posse única e exclusivamente do COMODATÁRIO enquanto durar o contrato, sob pena de indenizar o COMODANTE no valor equivalente 01 aparelho novo, do mesmo modelo que o cedido e no valor do marcado na época da compra, que poderá ser cobrado na via judicial. No caso de troca do endereço de prestação dos serviços do COMODATÁRIO, este deverá solicitar por escrito o consentimento do COMODANTE, que se reserva no direito de autorizar ou não, importando a violação desta cláusula na retenção do aparelho por parte do cedente.

5º) O COMODATÁRIO deverá permitir a inspeção e fiscalização do objeto por parte do COMODANTE sempre que este entender necessário.

6º) Em caso de defeito técnico o COMODATÁRIO deverá comunicar o COMODANTE por escrito, de forma a serem tomadas todas as medidas cabíveis, que podem ir desde a manutenção do bem ou a sua troca por outro. Caso o defeito seja por culpa do COMODATÁRIO, este deverá arcar com as despesas.

7º) O COMODANTE não se responsabilizará por produtos danificados em razão da falta de energia elétrica, ou acidentes causados por casos fortuitos e forças maiores.

8º) O COMODANTE irá fornecer todo o produto que será oferecido ao COMODATÁRIO para venda, mediante compra dos mesmos pelo segundo, de forma que havendo atraso no pagamento dos mesmos, ao COMODATÁRIO será imposto multa no importe de 6%, juros de 0,20% ao dia, bem como custas judiciais que possam haver e honorários do advogado do COMODANTE no importe de 30% sobre o valor do débito.`, 180)
    
    for (let i = 0; i < obgLines.length; i++) {
      if (y > 270) {
        doc.addPage()
        y = 15
      }
      doc.text(obgLines[i], 15, y)
      y += 5
    }

    y += 5
    if (y > 270) {
      doc.addPage()
      y = 15
    }

    doc.setFont('helvetica', 'bold')
    doc.text('DO PRAZO DE VALIDADE', 15, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    const prazoLines = doc.splitTextToSize(`9º) Este contrato será por tempo indeterminado, podendo ser unilateralmente rescindido por ambas as partes, havendo justo motivo para tanto, devendo notificar a outra parte por escrito com antecedência mínima de 48 horas.

10º) Assinam ao final, além das partes, 02 testemunhas.

Elege-se o foro da comarca de Porto Seguro - BA para dirimir quaisquer controvérsias oriundas do presente contrato.

Porto Seguro, ${new Date(order.created_at || new Date()).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.`, 180)

    for (let i = 0; i < prazoLines.length; i++) {
      if (y > 270) {
        doc.addPage()
        y = 15
      }
      doc.text(prazoLines[i], 15, y)
      y += 5
    }

    y += 10
    if (y > 230) {
      doc.addPage()
      y = 20
    }
  } else {
    // Termo de Recolha
    const recolhaText = `Serve o presente termo para atestar que na presente data, foi recolhido o equipamento descrito abaixo (Item1.) do cliente:

• CNPJ/CPF: ${order.customer?.document || '_____________________'}
• Razão Social: ${order.customer?.legal_name || order.customer?.fantasy_name || '______________'}
• Endereço: ${[order.customer?.address, order.customer?.number, order.customer?.neighborhood, order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}

• Tipo de equipamento: ${order.equipment?.type || '______________________'}
• Modelo: ${order.equipment?.model || '_____________'}
• Número do patrimônio: ${order.equipment?.patrimony || '_________'}
(1) Quantidade: 1

As partes assinam o presente documento em 2(duas) vias de igual teor e forma na presença de 2(duas) testemunhas abaixo identificadas.

Porto Seguro, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
    
    const recolhaLines = doc.splitTextToSize(recolhaText, 180)
    for (let i = 0; i < recolhaLines.length; i++) {
      if (y > 270) {
        doc.addPage()
        y = 15
      }
      doc.text(recolhaLines[i], 15, y)
      y += 6
    }
    y += 20
  }

  doc.setLineWidth(0.3)
  doc.line(60, y, 150, y)
  y += 5
  doc.text('Assinatura do COMODATÁRIO', 105, y, { align: 'center' })
  doc.text(`${order.customer?.legal_name || order.customer?.fantasy_name || '______________'}`, 105, y + 5, { align: 'center' })

  if (order.signature_data) {
    try {
      doc.addImage(order.signature_data, 'PNG', 75, y - 25, 60, 20)
    } catch (err) {
      console.error('Error rendering signature', err)
    }
  }

  const filename = `contrato_comodato_${order.os_number || order.id}.pdf`
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfOutput = doc.output('datauristring')
      const base64Data = pdfOutput.split(',')[1]
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      })
      await Share.share({
        title: `Contrato - ${order.customer?.fantasy_name || ''}`,
        text: 'Segue o contrato assinado',
        url: result.uri
      })
    } catch (e: any) {
      throw new Error(`Erro ao compartilhar PDF: ${e.message}`)
    }
  } else {
    doc.save(filename)
  }
}

export async function generateRouteReportPDF(route: any, clients: any[], routeOrders: any[], company: any, includeProofs: boolean = false): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let y = 15

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(79, 70, 229)
  const compNameText = company?.name || 'Empresa Emissora'
  const compNameLines = doc.splitTextToSize(compNameText, 120)
  doc.text(compNameLines, 15, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('RELATÓRIO DE ROTA', 195, y, { align: 'right' })

  let currentY = y + (compNameLines.length * 5)
  y = Math.max(currentY, y + 10)
  
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(15, y, 195, y)
  y += 8

  // Route Details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('DETALHES DA ROTA', 15, y)

  y += 6
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(`Carga:`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${route.operation?.load_number || 'N/A'}`, 30, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Motorista:`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${route.driver?.name || 'N/A'}`, 35, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Ajudante:`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${route.helper?.name || 'N/A'}`, 35, y)

  // Find start/end times
  const deliveredItems = [
    ...clients.filter(c => c.status === 'delivered' || c.status === 'delivered_with_divergence' || c.status === 'returned').map(c => ({ date: new Date(c.signed_at || c.updated_at).getTime(), data: c })),
    ...routeOrders.filter(o => o.status === 'concluido' || o.status === 'cancelado').map(o => ({ date: new Date(o.updated_at).getTime(), data: o }))
  ].filter(x => !isNaN(x.date)).sort((a, b) => a.date - b.date)

  const firstDelivery = deliveredItems.length > 0 ? deliveredItems[0].date : null
  const lastDelivery = deliveredItems.length > 0 ? deliveredItems[deliveredItems.length - 1].date : null

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Início (Primeira Entrega):`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(firstDelivery ? formatDateTime(new Date(firstDelivery).toISOString()) : 'N/A', 60, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Fim (Última Entrega):`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(lastDelivery ? formatDateTime(new Date(lastDelivery).toISOString()) : 'N/A', 55, y)

  y += 8
  doc.setLineWidth(0.2)
  doc.line(15, y, 195, y)
  y += 8

  // Clients List
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('CLIENTES DA ROTA', 15, y)
  y += 6

  const allStops = [
    ...clients.map(c => ({ ...c, isClient: true })),
    ...routeOrders.map(o => ({ ...o, isClient: false }))
  ].sort((a, b) => (a.delivery_sequence || 0) - (b.delivery_sequence || 0))

  for (const stop of allStops) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    const name = stop.isClient ? stop.name : (stop.customer?.legal_name || stop.customer?.fantasy_name || 'OS sem cliente')
    const typeLabel = stop.isClient ? '' : ' [OS]'
    
    let statusText = 'Pendente'
    let statusColor = [100, 116, 139] // Gray
    if (stop.status === 'delivered') { statusText = 'Entregue'; statusColor = [16, 185, 129] }
    if (stop.status === 'delivered_with_divergence') { statusText = 'Divergência'; statusColor = [245, 158, 11] }
    if (stop.status === 'returned') { statusText = 'Retornado'; statusColor = [220, 38, 38] }
    if (stop.status === 'canceled') { statusText = 'Cancelado'; statusColor = [220, 38, 38] }
    if (stop.status === 'concluido') { statusText = 'Concluído'; statusColor = [16, 185, 129] }

    doc.text(`${name}${typeLabel}`, 15, y)
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(statusText, 195, y, { align: 'right' })

    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    
    const timeText = (stop.status === 'delivered' || stop.status === 'delivered_with_divergence' || stop.status === 'returned' || stop.status === 'concluido') 
      ? `Realizado em: ${formatDateTime(stop.signed_at || stop.updated_at)}` 
      : 'Não finalizado'
    doc.text(timeText, 15, y)
    
    y += 6
  }

  // Divergences
  const divergences = clients.filter(c => c.status === 'delivered_with_divergence' || c.status === 'returned')
  if (divergences.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    } else {
      y += 8
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(15, y, 195, y)
      y += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(245, 158, 11) // Amber
    doc.text('DIVERGÊNCIAS REGISTRADAS', 15, y)
    y += 6

    for (const client of divergences) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(`Cliente: ${client.name}`, 15, y)
      y += 5

      if (client.status === 'returned') {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(220, 38, 38)
        const text = `PEDIDO TOTALMENTE RETORNADO. Motivo: ${client.return_reason || 'Não informado'}`
        const lines = doc.splitTextToSize(text, 180)
        doc.text(lines, 15, y)
        y += (lines.length * 4) + 2
      } else {
        const itemsWithDivergence = (client.delivery_items || []).filter((i: any) => i.quantity_scanned !== i.quantity_expected)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        for (const item of itemsWithDivergence) {
          if (y > 280) { doc.addPage(); y = 20 }
          const diff = item.quantity_scanned - item.quantity_expected
          const type = diff > 0 ? 'Excedente' : 'Faltante'
          const qty = Math.abs(diff)
          const op = item.requested_by_name ? ` [Solicitado por ${item.requested_by_name}]` : ''
          let text = `- Item: ${item.description} (${type}: ${qty})`
          if (item.return_reason) text += ` | Motivo: ${item.return_reason}`
          text += op
          const lines = doc.splitTextToSize(text, 180)
          doc.text(lines, 15, y)
          y += (lines.length * 4)
        }
        y += 2
      }
    }
  }

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Relatório gerado eletronicamente pelo sistema Estoque Fácil WMS.', 15, 287)

  if (includeProofs) {
    const completedClients = clients.filter(c => c.status === 'delivered' || c.status === 'delivered_with_divergence' || c.status === 'returned')
    for (const client of completedClients) {
      doc.addPage()
      drawDeliveryProofOnDoc(doc, client, company)
    }
  }

  const filename = includeProofs 
    ? `relatorio_comprovantes_${route.operation?.load_number || route.id}.pdf`
    : `relatorio_rota_${route.operation?.load_number || route.id}.pdf`
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfOutput = doc.output('datauristring')
      const base64Data = pdfOutput.split(',')[1]
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      })
      await Share.share({
        title: `Relatório Rota - ${route.operation?.load_number || ''}`,
        text: 'Segue relatório da rota',
        url: result.uri
      })
    } catch (e: any) {
      throw new Error(`Erro ao compartilhar PDF: ${e.message}`)
    }
  } else {
    doc.save(filename)
  }
}
