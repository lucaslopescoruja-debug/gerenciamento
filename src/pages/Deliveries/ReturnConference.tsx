import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ScanLine, Search, CheckCircle2, AlertTriangle, PenTool, Undo2 } from 'lucide-react'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'

export default function ReturnConference() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [searchInput, setSearchInput] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: route, isLoading: isRouteLoading } = useQuery({
    queryKey: ['delivery_route', id],
    queryFn: () => deliveriesApi.getDeliveryRoute(id!),
    enabled: !!id,
  })

  const { data: clients = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ['delivery_clients', id],
    queryFn: () => deliveriesApi.getDeliveryClients(id!),
    enabled: !!id,
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  // We maintain the scanned state locally until it's finished
  const [scannedItemsState, setScannedItemsState] = useState<Record<string, number>>({})

  // Compute the expected return items from clients
  const expectedReturnItems = useMemo(() => {
    const itemsMap = new Map<string, any>()
    
    clients.forEach((c: any) => {
      const isClientReturned = c.status === 'returned'
      c.delivery_items?.forEach((item: any) => {
        if (item.returned_to_stock) return
        
        let returnQty = 0
        if (isClientReturned) {
          returnQty = item.quantity_expected
        } else {
          returnQty = Math.max(0, item.quantity_expected - item.quantity_scanned)
        }
        
        if (returnQty > 0) {
          const existing = itemsMap.get(item.product_code)
          if (existing) {
            existing.quantity_expected += returnQty
            existing.items_ids.push(item.id)
          } else {
            itemsMap.set(item.product_code, {
              product_id: item.product_id,
              product_code: item.product_code,
              description: item.description,
              quantity_expected: returnQty,
              items_ids: [item.id]
            })
          }
        }
      })
    })
    
    return Array.from(itemsMap.values())
  }, [clients])

  const confirmReturnMutation = useMutation({
    mutationFn: ({ items, hasDivergence }: { items: any[], hasDivergence: boolean }) => 
      deliveriesApi.confirmRouteReturn(id!, items, hasDivergence),
    onSuccess: () => {
      toast.success('Retorno finalizado e estoque atualizado!')
      queryClient.invalidateQueries({ queryKey: ['delivery_route', id] })
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id] })
      navigate(`/cargas`)
    },
    onError: (e: any) => {
      toast.error(`Erro ao finalizar retorno: ${e.message}`)
    }
  })

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
    } catch(e) {}
  }

  useEffect(() => {
    const interval = setInterval(() => { if (document.activeElement !== inputRef.current && !showDropdown) inputRef.current?.focus() }, 1000)
    return () => clearInterval(interval)
  }, [showDropdown])

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const processBarcode = (barcode: string) => {
    const normalized = normalizeCode(barcode)
    if (!normalized) return

    const existingItem = expectedReturnItems.find(i => normalizeCode(i.product_code) === normalized)

    if (existingItem) {
      const currentScanned = scannedItemsState[normalized] || 0
      const newQty = currentScanned + 1
      
      if (newQty > existingItem.quantity_expected) {
        playBeep('warning')
        toast.warning(`Atenção: Este item excedeu a quantidade esperada de retorno (${existingItem.quantity_expected}).`)
      } else {
        playBeep('success')
      }
      
      setScannedItemsState(prev => ({
        ...prev,
        [normalized]: newQty
      }))
    } else {
      const prod = allProducts.find(p => normalizeCode(p.code) === normalized || (p.external_code && normalizeCode(p.external_code) === normalized))
      if (prod) {
        playBeep('warning')
        toast.warning(`Atenção: Produto '${prod.description}' NÃO consta como pendente de retorno. Você pode bipá-lo, mas é uma divergência.`)
        // We still allow it? The user said "vai voltar pro estoque". 
        // We can add it dynamically to expectedReturnItems or handle it.
        // For simplicity, let's just add it to scanned items using the prod code.
        const pCode = normalizeCode(prod.code)
        setScannedItemsState(prev => ({
          ...prev,
          [pCode]: (prev[pCode] || 0) + 1
        }))
        
        // Push it dynamically to expected array so it renders
        if (!expectedReturnItems.find(i => normalizeCode(i.product_code) === pCode)) {
          expectedReturnItems.push({
            product_id: prod.id,
            product_code: prod.code,
            description: prod.description,
            quantity_expected: 0,
            items_ids: []
          })
        }
      } else {
        playBeep('error')
        toast.error('Produto não encontrado no banco de dados')
      }
    }
  }

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scannedCode.trim()) {
      e.preventDefault()
      processBarcode(scannedCode.trim())
      setScannedCode('')
    }
  }

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

  const { progress, hasDivergence, totalExpected } = useMemo(() => {
    if (expectedReturnItems.length === 0) return { progress: 0, hasDivergence: false, totalExpected: 0 }
    
    let totalExpected = 0
    let totalScanned = 0
    let divergenceFound = false

    expectedReturnItems.forEach(i => {
      const scanned = scannedItemsState[normalizeCode(i.product_code)] || 0
      totalExpected += i.quantity_expected
      totalScanned += Math.min(scanned, i.quantity_expected)
      if (scanned !== i.quantity_expected) divergenceFound = true
    })

    return {
      progress: totalExpected > 0 ? Math.round((totalScanned / totalExpected) * 100) : 100,
      hasDivergence: divergenceFound,
      totalExpected
    }
  }, [expectedReturnItems, scannedItemsState])

  const handleFinish = () => {
    if (hasDivergence) {
      if (!window.confirm('Existem divergências. A quantidade física lida não bate com o esperado. Deseja finalizar e alertar o gestor mesmo assim?')) {
        return
      }
    }
    
    const finalItems = expectedReturnItems.map(i => ({
      ...i,
      scannedQty: scannedItemsState[normalizeCode(i.product_code)] || 0
    }))
    
    confirmReturnMutation.mutate({ items: finalItems, hasDivergence })
  }

  if (isRouteLoading || isClientsLoading) return <div className="p-8 text-center text-muted-foreground">Carregando retorno...</div>

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] slide-in max-w-2xl mx-auto">
      <div className="p-4 pb-2 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-xl font-bold gradient-text leading-tight flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-amber-500" /> Retorno da Rota
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{route?.operation?.load_number}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-2xl font-black gradient-text">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted/10 sticky top-[60px] md:top-0 z-40 backdrop-blur-md border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              ref={inputRef}
              type="text"
              inputMode="none"
              placeholder="Bipar ou digitar código..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyDown={handleScan}
              className="pl-9 h-12 text-lg shadow-inner bg-background font-mono"
              autoFocus
            />
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Buscar p/ descrição..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-12 bg-background"
            />
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <div key={p.id} className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => selectManualProduct(p)}>
                      <div>
                        <div className="font-bold text-foreground text-sm">{p.code}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 pb-4 flex-1">
        {expectedReturnItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Nenhum retorno esperado nesta rota.</div>
        ) : (
          expectedReturnItems.map((item, index) => {
            const scanned = scannedItemsState[normalizeCode(item.product_code)] || 0
            const expected = item.quantity_expected
            const isOk = scanned === expected && expected > 0
            const isExcess = scanned > expected

            return (
              <div key={index} className={`glass-card p-3 flex flex-col gap-2 border-l-4 transition-colors ${
                isOk ? 'border-emerald-500 bg-emerald-500/5' : 
                isExcess ? 'border-amber-500 bg-amber-500/5' : 
                scanned > 0 ? 'border-blue-500 bg-blue-500/5' : 'border-muted/30'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm leading-tight">{item.description}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.product_code}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-bold font-mono ${isOk ? 'text-emerald-500' : isExcess ? 'text-amber-500' : 'text-blue-500'}`}>
                          {scanned}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">/ {expected}</span>
                      </div>
                      {isExcess && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1">Excedente</span>}
                      {isOk && <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1">OK</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 mt-6 border-t border-border pb-8">
        <Button 
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          onClick={handleFinish}
          disabled={confirmReturnMutation.isPending || expectedReturnItems.length === 0}
        >
          <PenTool className="h-4 w-4 mr-2" /> Finalizar Retorno
        </Button>
      </div>
    </div>
  )
}
