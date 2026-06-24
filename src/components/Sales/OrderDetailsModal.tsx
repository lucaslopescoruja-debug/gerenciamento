import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orderId, isOpen, onOpenChange }: OrderDetailsModalProps) {
  const [details, setDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col overflow-hidden w-[95vw]">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Resumo do Pedido {details?.order_number ? `#${details.order_number}` : ''}</DialogTitle>
          <DialogDescription>
            Detalhes dos itens e valores deste pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto flex-1">
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
                  <span className="font-medium">{formatCurrency((details.net_amount || 0) + (details.total_discount || 0))}</span>
                </div>
                <div className="flex justify-between w-full sm:w-64 text-sm text-red-500">
                  <span>Descontos:</span>
                  <span>- {formatCurrency(details.total_discount || 0)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2 border-t border-border">
                  <span>Total Líquido:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(details.net_amount || 0)}</span>
                </div>
              </div>

              {details.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observações:</p>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
                    {details.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Erro ao carregar os detalhes do pedido.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
