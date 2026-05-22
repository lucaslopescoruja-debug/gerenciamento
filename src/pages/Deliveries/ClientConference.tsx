import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, ScanLine, Search, CheckCircle2, AlertTriangle, Save, PenTool } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientConference() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const [searchInput, setSearchInput] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  
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
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, qty, status }: { itemId: string, qty: number, status: string }) => 
      deliveriesApi.updateDeliveryItemQuantity(itemId, qty, status),
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
    if (client && client.status !== 'delivered' && client.status !== 'delivered_with_divergence' && client.status !== 'canceled') {
      const interval = setInterval(() => { if (document.activeElement !== inputRef.current && !showDropdown) inputRef.current?.focus() }, 1000)
      return () => clearInterval(interval)
    }
  }, [showDropdown, client])

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
      // Pertence ao cliente
      const newQty = existingItem.quantity_scanned + 1
      let status = 'pending'
      if (newQty === existingItem.quantity_expected) status = 'ok'
      if (newQty > existingItem.quantity_expected) status = 'divergent' // Excedente
      
      updateItemMutation.mutate({ itemId: existingItem.id, qty: newQty, status })
      
      if (status === 'divergent') {
        playBeep('warning')
        toast.warning('Atenção: Quantidade excedente do pedido.')
      } else {
        playBeep('success')
      }
    } else {
      // Produto não pertence ao cliente na lista inicial
      // Localizar o produto globalmente para adicionar como divergente
      const prod = allProducts.find(p => normalizeCode(p.code) === normalized || (p.external_code && normalizeCode(p.external_code) === normalized))
      
      if (prod) {
        playBeep('error')
        toast.error('Produto NÃO pertence a este cliente!')
        
        // Add as extra item
        addItemMutation.mutate({
          product_id: prod.id,
          product_code: prod.code,
          description: prod.description,
          quantity_expected: 0,
          quantity_scanned: 1,
          status: 'divergent' // excedente
        })
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

  const { progress, hasDivergence } = useMemo(() => {
    if (items.length === 0) return { progress: 0, hasDivergence: false }
    
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
      hasDivergence: divergenceFound
    }
  }, [items])

  const handleFinish = () => {
    const finalStatus: 'delivered_with_divergence' | 'delivered' = hasDivergence ? 'delivered_with_divergence' : 'delivered'
    if (hasDivergence) {
      if (!window.confirm('Existem divergências (faltas ou excessos) neste pedido. Tem certeza que deseja finalizar assim mesmo?')) {
        return
      }
    }
    updateClientStatusMutation.mutate(finalStatus)
  }

  if (isClientLoading || isItemsLoading) return <div className="p-8 text-center text-muted-foreground">Carregando pedido...</div>
  if (!client) return <div className="p-8 text-center text-red-500">Cliente não encontrado</div>

  const isFinished = client.status === 'delivered' || client.status === 'delivered_with_divergence' || client.status === 'canceled'

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] slide-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex-none p-4 pb-2 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-xl font-bold gradient-text leading-tight line-clamp-1">{client.name}</h1>
              {client.address && <p className="text-xs text-muted-foreground line-clamp-1">{client.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black gradient-text">{progress}%</span>
          </div>
        </div>

        {!isFinished && (
          <div className="space-y-2 relative pb-2">
            <div className="relative">
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
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Busca manual (código ou descrição)..."
                className="pl-10 h-10 text-sm bg-muted/50"
              />
              {showDropdown && searchInput.trim().length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto divide-y divide-border">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => selectManualProduct(p)}
                      >
                        <span className="text-sm font-medium">{p.description}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">Nenhum produto encontrado</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Nenhum item na lista deste cliente.</div>
        ) : (
          items.map(item => {
            const isOk = item.quantity_scanned === item.quantity_expected && item.quantity_expected > 0
            const isMissing = item.quantity_scanned < item.quantity_expected
            const isExcess = item.quantity_scanned > item.quantity_expected || item.quantity_expected === 0

            return (
              <div key={item.id} className={`glass-card p-3 flex flex-col gap-2 border-l-4 transition-colors ${
                isOk ? 'border-emerald-500 bg-emerald-500/5' : 
                isExcess ? 'border-amber-500 bg-amber-500/5' : 
                item.quantity_scanned > 0 ? 'border-blue-500 bg-blue-500/5' : 'border-muted/30'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm leading-tight">{item.description}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.product_code}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-bold font-mono ${isOk ? 'text-emerald-500' : isExcess ? 'text-amber-500' : 'text-blue-500'}`}>
                        {item.quantity_scanned}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">/ {item.quantity_expected}</span>
                    </div>
                    {isExcess && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1">Excedente</span>}
                    {isOk && <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1">OK</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Buttons */}
      {!isFinished && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-10 md:absolute md:bottom-0">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              onClick={() => {
                updateClientStatusMutation.mutate('waiting')
              }}
              disabled={updateClientStatusMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" /> Salvar Pausa
            </Button>
            <Button 
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              onClick={handleFinish}
              disabled={updateClientStatusMutation.isPending}
            >
              <PenTool className="h-4 w-4 mr-2" /> Finalizar Entrega
            </Button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-10 md:absolute md:bottom-0">
          <div className="max-w-2xl mx-auto">
            {client.signature_data ? (
              <div className="glass-card p-4 text-center border-emerald-500/30 text-emerald-500 font-bold flex items-center justify-center gap-2">
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
    </div>
  )
}
