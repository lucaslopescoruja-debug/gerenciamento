import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deliveriesApi } from '@/api/deliveries'
import { toast } from '@/components/ui/toaster'
import { AlertTriangle, Minus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface Shortage {
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  quantity_missing: number
}

interface ShortageResolverModalProps {
  isOpen: boolean
  onClose: () => void
  onResolved: () => void
  shortages: Shortage[]
  operationId: string
}

export function ShortageResolverModal({ isOpen, onClose, onResolved, shortages, operationId }: ShortageResolverModalProps) {
  const [route, setRoute] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Record<delivery_item_id, number_to_subtract>
  const [cuts, setCuts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isOpen && operationId) {
      loadRouteAndClients()
    } else {
      setCuts({})
    }
  }, [isOpen, operationId])

  const loadRouteAndClients = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Route linked to this Load
      const { data: routeData, error: routeErr } = await supabase
        .from('delivery_routes')
        .select('*')
        .eq('operation_id', operationId)
        .single()

      if (routeErr || !routeData) {
        toast.warning('Nenhuma rota de entrega vinculada a esta carga foi encontrada.')
        onResolved()
        return
      }

      setRoute(routeData)

      // 2. Fetch Delivery Clients and Items
      const clientsData = await deliveriesApi.getDeliveryClients(routeData.id)
      setClients(clientsData || [])
    } catch (err: any) {
      toast.error('Erro ao buscar dados da rota: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCutChange = (itemId: string, delta: number, maxCuts: number, itemExpected: number) => {
    setCuts(prev => {
      const currentCut = prev[itemId] || 0
      const nextCut = currentCut + delta

      if (nextCut < 0) return prev
      if (nextCut > itemExpected) return prev
      
      const item = clients.flatMap(c => c.delivery_items).find(i => i.id === itemId)
      if (item) {
        const totalCutsForProduct = Object.entries(prev).reduce((sum, [key, val]) => {
          const relatedItem = clients.flatMap(c => c.delivery_items).find(i => i.id === key)
          if (relatedItem && relatedItem.product_code === item.product_code && key !== itemId) {
            return sum + val
          }
          return sum
        }, 0)

        if (delta > 0 && totalCutsForProduct + nextCut > maxCuts) {
          toast.warning('VocǦ jǭ cortou todas as faltas para este produto.')
          return prev
        }
      }

      return { ...prev, [itemId]: nextCut }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const promises = []
      for (const [itemId, cutQty] of Object.entries(cuts)) {
        if (cutQty > 0) {
          const item = clients.flatMap(c => c.delivery_items).find(i => i.id === itemId)
          if (item) {
            const newExpected = item.quantity_expected - cutQty
            if (newExpected <= 0) {
              promises.push(deliveriesApi.deleteDeliveryItem(itemId))
            } else {
              promises.push(deliveriesApi.updateDeliveryItem(itemId, { quantity_expected: newExpected }))
            }
          }
        }
      }

      // Also update the operation_items expected quantity so the load no longer shows as having a shortage for the resolved items
      for (const shortage of shortages) {
        const totalCutForThisProduct = Object.entries(cuts).reduce((sum, [itemId, val]) => {
          const item = clients.flatMap(c => c.delivery_items).find((i: any) => i.id === itemId)
          return item && item.product_code === shortage.product_code ? sum + val : sum
        }, 0)
        
        if (totalCutForThisProduct > 0) {
          promises.push(
            supabase.from('operation_items')
              .update({ quantity_expected: shortage.quantity_expected - totalCutForThisProduct })
              .eq('operation_id', operationId)
              .eq('product_code', shortage.product_code)
          )
        }
      }

      await Promise.all(promises)
      toast.success('Faltas resolvidas e pedidos ajustados com sucesso!')
      onResolved()
    } catch (err: any) {
      toast.error('Erro ao salvar cortes: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  if (!isLoading && !route) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Resolver Faltas no Carregamento
          </DialogTitle>
          <DialogDescription>
            Foram encontradas faltas fsicas. De qual(is) cliente(s) vocǦ deseja cortar os produtos faltantes para refletir na entrega?
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando pedidos da rota...</div>
          ) : (
            shortages.map(shortage => {
              const clientsWithProduct = clients.filter(c => 
                c.delivery_items?.some((i: any) => i.product_code === shortage.product_code)
              )

              const totalCutForThisProduct = Object.entries(cuts).reduce((sum, [itemId, val]) => {
                const item = clientsWithProduct.flatMap(c => c.delivery_items).find((i: any) => i.id === itemId)
                return item && item.product_code === shortage.product_code ? sum + val : sum
              }, 0)

              const isResolved = totalCutForThisProduct === shortage.quantity_missing

              return (
                <div key={shortage.product_code} className="bg-muted/30 border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{shortage.description}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{shortage.product_code}</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded font-bold ${isResolved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      Faltam: {shortage.quantity_missing - totalCutForThisProduct} / {shortage.quantity_missing}
                    </div>
                  </div>

                  {clientsWithProduct.length === 0 ? (
                    <p className="text-xs text-red-500 italic">Nenhum cliente na rota espera este produto.</p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {clientsWithProduct.map(client => {
                        const item = client.delivery_items.find((i: any) => i.product_code === shortage.product_code)
                        const currentCut = cuts[item.id] || 0
                        const remainingExpected = item.quantity_expected - currentCut

                        return (
                          <div key={client.id} className="flex items-center justify-between bg-background p-2 rounded border border-border/50">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="text-sm font-medium truncate" title={client.name}>{client.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Esperado: {item.quantity_expected} {currentCut > 0 && <span className="text-red-500 font-bold ml-1">(-{currentCut})</span>}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-7 w-7 rounded-full"
                                onClick={() => handleCutChange(item.id, -1, shortage.quantity_missing, item.quantity_expected)}
                                disabled={currentCut <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-bold w-4 text-center">{currentCut}</span>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-7 w-7 rounded-full text-red-500 border-red-200 hover:bg-red-50"
                                onClick={() => handleCutChange(item.id, 1, shortage.quantity_missing, item.quantity_expected)}
                                disabled={totalCutForThisProduct >= shortage.quantity_missing || remainingExpected <= 0}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar Despacho
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving} className="bg-primary hover:bg-primary/90 text-white font-bold">
            {isSaving ? 'Salvando...' : 'Confirmar Cortes e Despachar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
