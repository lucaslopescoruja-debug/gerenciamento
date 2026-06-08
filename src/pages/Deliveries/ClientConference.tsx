import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ScanLine, Search, CheckCircle2, AlertTriangle, Save, PenTool, Camera, Trash2, MapPin, FileDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'
import { generateDeliveryProofPDF } from '@/utils/pdf'

export default function ClientConference() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  
  const [searchInput, setSearchInput] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['delivery_client', clientId],
    queryFn: () => deliveriesApi.getDeliveryClient(clientId!),
    enabled: !!clientId,
  })

  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['delivery_items', clientId],
    queryFn: () => deliveriesApi.getDeliveryItems(clientId!),
    enabled: !!clientId,
    refetchInterval: 5000 // Poll every 5s to catch manager approvals automatically
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, qty, status, return_reason }: { itemId: string, qty: number, status: string, return_reason?: string }) => 
      deliveriesApi.updateDeliveryItemQuantity(itemId, qty, status, return_reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
    }
  })

  const addItemMutation = useMutation({
    mutationFn: (itemData: any) => deliveriesApi.addDeliveryItem(clientId!, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
    }
  })

  const requestApprovalMutation = useMutation({
    mutationFn: ({ itemId, requestedQty }: { itemId: string, requestedQty: number }) => 
      deliveriesApi.requestItemApproval(itemId, requestedQty),
    onSuccess: () => {
      toast.success('Liberação solicitada ao gestor.')
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deliveriesApi.deleteDeliveryItem(itemId),
    onSuccess: () => {
      toast.success('Item removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover item: ${e.message}`)
    }
  })

  const handleDeleteItem = (itemId: string, description: string) => {
    if (window.confirm(`Deseja realmente remover o item "${description}" do pedido do cliente?`)) {
      deleteItemMutation.mutate(itemId)
    }
  }

  const handleToggleCheckItem = (item: any) => {
    const done = item.quantity_scanned >= item.quantity_expected
    const actionText = done ? 'desmarcar' : 'marcar como entregue/conferido'
    if (!window.confirm(`Deseja realmente ${actionText} o item "${item.description}"?`)) {
      return
    }

    const newQty = done ? 0 : item.quantity_expected
    const status = newQty >= item.quantity_expected ? 'ok' : 'pending'

    // Optimistic cache update
    const updated = {
      ...item,
      quantity_scanned: newQty,
      status
    }
    queryClient.setQueryData(['delivery_items', clientId], (old: any[] = []) =>
      old.map(i => i.id === item.id ? updated : i)
    )

    updateItemMutation.mutate({ itemId: item.id, qty: newQty, status })
  }

  const updateClientStatusMutation = useMutation({
    mutationFn: (status: 'pending' | 'waiting' | 'delivered' | 'delivered_with_divergence' | 'canceled') => 
      deliveriesApi.updateDeliveryClient(clientId!, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery_client', clientId] })
      if (data.status.includes('delivered')) {
        toast.success('Conferência finalizada. Prosseguindo para assinatura...')
        navigate(`/entregas/cliente/${clientId}/assinatura`)
      } else {
        toast.success('Progresso salvo!')
      }
    }
  })

  const returnClientMutation = useMutation({
    mutationFn: (reason: string) => deliveriesApi.returnDeliveryClient(clientId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_client', clientId] })
      toast.success('Pedido retornado com sucesso!')
      navigate(`/entregas/${client?.delivery_route_id || ''}`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao retornar pedido: ${error.message}`)
    }
  })

  const isFinished = client ? (client.status === 'delivered' || client.status === 'delivered_with_divergence' || client.status === 'canceled' || client.status === 'returned') : false

  // Play beep sound
  const playBeep = (type: 'success' | 'error' | 'warning' = 'success') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'success') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime) } 
      else if (type === 'warning') { osc.type = 'square'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime) }
      else { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime); gain.gain.setValueAtTime(0.2, ctx.currentTime) }
      osc.start()
      osc.stop(ctx.currentTime + (type === 'error' ? 0.3 : 0.1))
      if ('vibrate' in navigator) navigator.vibrate(type === 'error' ? [200, 100, 200] : type === 'warning' ? [100, 50, 100] : 100)
    } catch(e) {}
  }

  // Focus lock
  useEffect(() => {
    if (client && !isFinished) {
      const interval = setInterval(() => { if (document.activeElement !== inputRef.current && !showDropdown) inputRef.current?.focus() }, 1000)
      return () => clearInterval(interval)
    }
  }, [showDropdown, client, isFinished])

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scannedCode.trim()) {
      e.preventDefault()
      processBarcode(scannedCode.trim())
      setScannedCode('')
    }
  }

  const processBarcode = (barcode: string) => {
    const normalized = normalizeCode(barcode)
    if (!normalized) return

    // Verifica se pertence ao cliente
    const existingItem = items.find(i => normalizeCode(i.product_code) === normalized)

    if (existingItem) {
      if (existingItem.approval_status === 'pending') {
        playBeep('warning')
        toast.warning('Este item já está aguardando liberação do gestor.')
        return
      }

      // Pertence ao cliente
      const newQty = existingItem.quantity_scanned + 1
      let status = 'pending'
      if (newQty === existingItem.quantity_expected) status = 'ok'
      
      if (newQty > existingItem.quantity_expected) {
        playBeep('warning')
        if (window.confirm(`ATENÇÃO: Este item excedeu a quantidade do pedido (${existingItem.quantity_expected}). Deseja solicitar liberação do gestor para adicionar esta quantidade extra?`)) {
          requestApprovalMutation.mutate({ itemId: existingItem.id, requestedQty: newQty })
        }
        return // Do not update item scanned qty yet
      }
      
      updateItemMutation.mutate({ itemId: existingItem.id, qty: newQty, status })
      playBeep('success')
    } else {
      // Produto não pertence ao cliente na lista inicial
      const prod = allProducts.find(p => normalizeCode(p.code) === normalized || (p.external_code && normalizeCode(p.external_code) === normalized))
      
      if (prod) {
        playBeep('warning')
        if (window.confirm(`ATENÇÃO: Produto '${prod.description}' NÃO pertence a este pedido. Deseja solicitar liberação do gestor para adicioná-lo?`)) {
          toast.info('Solicitando liberação...')
          addItemMutation.mutate({
            product_id: prod.id,
            product_code: prod.code,
            description: prod.description,
            quantity_expected: 0,
            quantity_scanned: 0,
            status: 'divergent',
            approval_status: 'pending',
            requested_qty: 1
          })
        }
      } else {
        playBeep('error')
        toast.error('Produto não encontrado no banco de dados')
      }
    }
  }

  // Manual search
  useEffect(() => {
    if (searchInput.trim().length > 2) {
      const term = normalizeCode(searchInput)
      const filtered = allProducts.filter(p => 
        normalizeCode(p.code).includes(term) || 
        normalizeCode(p.description).includes(term)
      ).slice(0, 10)
      setFilteredProducts(filtered)
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [searchInput, allProducts])

  const selectManualProduct = (p: any) => {
    processBarcode(p.code)
    setSearchInput('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const { progress, hasDivergence, totalExpected, totalItems } = useMemo(() => {
    if (items.length === 0) return { progress: 0, hasDivergence: false, totalExpected: 0, totalItems: 0 }
    
    let totalExpected = 0
    let totalScanned = 0
    let divergenceFound = false

    items.forEach(i => {
      totalExpected += i.quantity_expected
      totalScanned += Math.min(i.quantity_scanned, i.quantity_expected) // cap progress at 100%
      if (i.quantity_scanned !== i.quantity_expected) divergenceFound = true
    })

    return {
      progress: totalExpected > 0 ? Math.round((totalScanned / totalExpected) * 100) : 100,
      hasDivergence: divergenceFound,
      totalExpected,
      totalItems: items.length
    }
  }, [items])

  const handleFinish = async () => {
    const finalStatus: 'delivered_with_divergence' | 'delivered' = hasDivergence ? 'delivered_with_divergence' : 'delivered'
    if (hasDivergence) {
      if (!window.confirm('Existem divergências (faltas ou excessos) neste pedido. Tem certeza que deseja finalizar assim mesmo?')) {
        return
      }
      const missingItems = items.filter(i => i.quantity_scanned < i.quantity_expected)
      for (const item of missingItems) {
        if (!item.return_reason) {
          const reason = window.prompt(`Qual o motivo da não entrega do item: ${item.description}?`)
          if (reason === null) return // user cancelled
          await updateItemMutation.mutateAsync({ itemId: item.id, qty: item.quantity_scanned, status: 'divergent', return_reason: reason })
        }
      }
    }
    updateClientStatusMutation.mutate(finalStatus)
  }

  const handleReturnOrder = () => {
    if (window.confirm("Deseja marcar este pedido como retornado?")) {
      const reason = window.prompt("Qual o motivo da devolução total do pedido?")
      if (reason === null) return
      returnClientMutation.mutate(reason)
    }
  }

  if (isClientLoading || isItemsLoading) return <div className="p-8 text-center text-muted-foreground">Carregando pedido...</div>
  if (!client) return <div className="p-8 text-center text-red-500">Cliente não encontrado</div>

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] slide-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 pb-2 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-xl font-bold gradient-text leading-tight line-clamp-1">{client.name}</h1>
              {client.address && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-muted-foreground line-clamp-1 hover:text-primary transition-colors hover:underline flex items-center gap-1 mt-0.5"
                  title="Ver no Google Maps"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> {client.address}
                </a>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 bg-muted/30 w-max px-2 py-0.5 rounded-md border border-border/50">
                <span className="font-medium text-foreground">{totalItems} <span className="opacity-70 font-normal">itens</span></span>
                <span className="opacity-50">•</span>
                <span className="font-medium text-foreground">{totalExpected} <span className="opacity-70 font-normal">volumes</span></span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-2xl font-black gradient-text">{progress}%</span>
            {isManager && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  try {
                    generateDeliveryProofPDF({ ...client, delivery_items: items }, company);
                    toast.success('Comprovante gerado com sucesso!');
                  } catch(e) {
                    toast.error('Erro ao gerar comprovante');
                  }
                }}
              >
                <FileDown className="h-4 w-4 md:mr-1.5" />
                <span className="hidden md:inline">Comprovante</span>
              </Button>
            )}
          </div>
        </div>
      </div>

        {!isFinished && (
          <div className="sticky top-[53px] md:top-[64px] z-20 p-4 bg-card/95 backdrop-blur-md border-b border-border shadow-sm space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-3 h-5 w-5 text-primary animate-pulse" />
                <Input 
                  ref={inputRef}
                  value={scannedCode}
                  onChange={e => setScannedCode(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="Bipe o código do produto..."
                  className="pl-10 h-12 text-lg font-mono bg-background border-primary/30 focus-visible:border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  autoFocus
                />
              </div>
              <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="outline" className="h-12 w-12 border-primary/30 text-primary hover:bg-primary/10" title="Usar câmera"><Camera className="h-5 w-5" /></Button>
            </div>

          </div>
        )}


      {/* Item List */}
      <div className="p-4 space-y-3 pb-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Nenhum item na lista deste cliente.</div>
        ) : (
          items.map(item => {
            const isPendingApproval = item.approval_status === 'pending'
            const isOk = item.quantity_scanned === item.quantity_expected && item.quantity_expected > 0
            const isMissing = item.quantity_scanned < item.quantity_expected
            const isExcess = item.quantity_scanned > item.quantity_expected || item.quantity_expected === 0

            return (
              <div key={item.id} className={`glass-card p-3 flex flex-col gap-2 border-l-4 transition-colors ${
                isPendingApproval ? 'border-purple-500 bg-purple-500/5' :
                isOk ? 'border-emerald-500 bg-emerald-500/5' : 
                isExcess ? 'border-amber-500 bg-amber-500/5' : 
                item.quantity_scanned > 0 ? 'border-blue-500 bg-blue-500/5' : 'border-muted/30'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm leading-tight">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                      {isManager && !isFinished && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.description)}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-500/10 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      {isPendingApproval ? (
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold font-mono text-purple-500">{item.requested_qty}</span>
                          <span className="text-[10px] uppercase font-bold text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1">Aguardando Gestor</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-bold font-mono ${isOk ? 'text-emerald-600 dark:text-emerald-600 dark:text-emerald-400' : isExcess ? 'text-amber-600 dark:text-amber-600 dark:text-amber-400' : 'text-blue-500'}`}>
                              {item.quantity_scanned}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">/ {item.quantity_expected}</span>
                          </div>
                          {item.approval_status === 'rejected' && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">Rejeitado</span>}
                          {isExcess && item.approval_status !== 'rejected' && <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1">Excedente</span>}
                          {isOk && <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1">OK</span>}
                        </>
                      )}
                    </div>
                    
                    {!isFinished && !isPendingApproval && (
                      <button
                        type="button"
                        onClick={() => handleToggleCheckItem(item)}
                        className="hover:scale-105 active:scale-95 transition-transform"
                        title={isOk ? "Desmarcar item" : "Marcar como conferido"}
                      >
                        {isOk ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500/50" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Buttons */}
      {!isFinished && (
        <div className="p-4 mt-6 border-t border-border pb-8 space-y-3">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              onClick={() => {
                updateClientStatusMutation.mutate('waiting')
              }}
              disabled={updateClientStatusMutation.isPending || returnClientMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" /> Salvar Pausa
            </Button>
            <Button 
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              onClick={handleFinish}
              disabled={updateClientStatusMutation.isPending || returnClientMutation.isPending}
            >
              <PenTool className="h-4 w-4 mr-2" /> Finalizar Entrega
            </Button>
          </div>
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="destructive" 
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              onClick={handleReturnOrder}
              disabled={updateClientStatusMutation.isPending || returnClientMutation.isPending}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Pedido Retornado
            </Button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="p-4 mt-6 border-t border-border pb-8">
          <div className="max-w-2xl mx-auto">
            {client.status === 'returned' ? (
              <div className="glass-card p-4 text-center border-red-500/30 text-red-500 font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pedido Retornado
              </div>
            ) : client.signature_data ? (
              <div className="glass-card p-4 text-center border-emerald-500/30 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Entrega Concluída e Assinada
              </div>
            ) : (
               <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                onClick={() => navigate(`/entregas/cliente/${clientId}/assinatura`)}
              >
                <PenTool className="h-4 w-4 mr-2" /> Coletar Assinatura Agora
              </Button>
            )}
          </div>
        </div>
      )}

      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={processBarcode}
      />
    </div>
  )
}
