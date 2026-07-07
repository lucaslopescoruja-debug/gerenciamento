import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'
import { Printer, Download, Copy, Send } from 'lucide-react'
import jsPDF from 'jspdf'
import { toPng } from 'html-to-image'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { InvoicePrintTemplate } from './InvoicePrintTemplate'
import { useNavigate } from 'react-router-dom'
import { useSalesCart } from '@/stores/salesCart'

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orderId, isOpen, onOpenChange }: OrderDetailsModalProps) {
  const [details, setDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { company } = useAuth()
  const navigate = useNavigate()
  const loadOrder = useSalesCart(state => state.loadOrder)

  useEffect(() => {
    if (isOpen && orderId) {
      loadDetails(orderId)
    } else {
      setDetails(null)
    }
  }, [isOpen, orderId])

  const loadDetails = async (id: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customer:customers(*),
          sales_rep:sales_reps(*),
          payment_condition:payment_conditions(*),
          items:sales_order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single()
        
      if (!error && data) {
        setDetails(data)
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    
    setIsGeneratingPdf(true)
    try {
      // Usar html-to-image no lugar de html2canvas para suportar oklch()
      const imgData = await toPng(printRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      })
      
      const pdf = new jsPDF('p', 'mm', 'a4', true)
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`Pedido_${details.order_number}.pdf`)
      
      toast.success('PDF gerado com sucesso!')
    } catch (error: any) {
      console.error("ERRO PDF:", error)
      toast.error(`Erro ao gerar PDF: ${error?.message || JSON.stringify(error) || 'Desconhecido'}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }



  const handleSendToMaxiprod = async () => {
    if (!orderId || !details) return
    setIsSending(true)
    toast.info('Enviando pedido para o Maxiprod...', { duration: 3000 })
    try {
      const { maxiprodApi } = await import('@/api/maxiprod')
      await maxiprodApi.sendSalesOrder(orderId)
      
      const { salesApi } = await import('@/api/sales')
      await salesApi.updateSalesOrder(orderId, { status: 'Faturado' })
      
      toast.success('Pedido enviado com sucesso e faturado!')
      loadDetails(orderId)
    } catch (e: any) {
      console.error(e)
      toast.error(`Erro ao enviar pedido: ${e.message || e}`)
    } finally {
      setIsSending(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Computed values since the DB aggregates might be zero if there is no trigger
  const computedSubtotal = details?.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0;
  const computedItemsDiscount = details?.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price - item.total_price), 0) || 0;
  const computedOrderDiscount = details?.total_discount || 0;
  const totalDiscount = computedItemsDiscount + computedOrderDiscount;
  const computedNetAmount = computedSubtotal - totalDiscount;

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 10mm; }
          body { overflow: visible !important; }
          body * { visibility: hidden; }
          #printable-order-details, #printable-order-details * { visibility: visible; }
          #printable-order-details {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide { display: none !important; }
          div[class*="bg-black/60"] { display: none !important; }
        `}
      </style>

      {/* Hidden off-screen wrapper for HTML-to-Image AND Print */}
      <div className="absolute top-[-9999px] left-[-9999px] print:static print:top-auto print:left-auto print:block print:w-full print:h-auto overflow-visible">
        <div id="printable-order-details">
          <InvoicePrintTemplate details={details} company={company} ref={printRef} />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden w-[95vw] print-hide">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-muted/30">


          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">Resumo do Pedido {details?.order_number ? `#${details.order_number}` : ''}</DialogTitle>
              <DialogDescription>
                Detalhes dos itens e valores deste pedido.
              </DialogDescription>
            </div>
            {details && (
              <div className="flex items-center gap-2">

                {details.status === 'Enviado' && (
                  <Button 
                    onClick={handleSendToMaxiprod} 
                    disabled={isSending} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-bold gap-1.5"
                  >
                    <Send className="h-4 w-4" /> {isSending ? 'Enviando...' : 'Enviar Maxiprod'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="h-9">
                  <Download className="h-4 w-4 mr-2" /> {isGeneratingPdf ? 'Gerando...' : 'Download PDF'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 bg-background print-hide">
          <div className="bg-background">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando detalhes...</div>
            ) : details ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Cliente</p>
                  <p className="text-sm font-semibold">{details.customer?.legal_name || 'Consumidor'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Vendedor</p>
                  <p className="text-sm font-semibold">{details.sales_rep?.nickname || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Data</p>
                  <p className="text-sm font-semibold">{formatDate(details.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Cond. Pgto</p>
                  <p className="text-sm font-semibold">{details.payment_condition?.name || '---'}</p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right w-24">Qtd</TableHead>
                      <TableHead className="text-right w-32">Preço Unit.</TableHead>
                      <TableHead className="text-right w-24">Desc. %</TableHead>
                      <TableHead className="text-right w-32">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{item.product?.description}</div>
                          <div className="text-xs text-muted-foreground">Cód: {item.product?.code}</div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{item.discount_percent || 0}%</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end space-y-2 bg-muted/20 p-4 rounded-lg">
                <div className="flex justify-between w-full sm:w-64 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(computedSubtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between w-full sm:w-64 text-sm text-red-500">
                    <span>Descontos:</span>
                    <span>- {formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2 border-t border-border">
                  <span>Total Líquido:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(computedNetAmount)}</span>
                </div>
              </div>

              {details.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observações:</p>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
                    {details.notes.replace(/\s*\[Origem: Importação Planilha\]\s*/g, '').trim()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Erro ao carregar os detalhes do pedido.</div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
