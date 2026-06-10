import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory, PlannedInventorySector, PlannedInventoryArea, PlannedInventoryCount, Product } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, ScanLine, Search, CheckCircle2, LayoutGrid, Camera, ChevronRight, ScanBarcode, Trash2 } from 'lucide-react'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'

export default function PlannedInventoryOperator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)

  const { data: inventory } = useQuery({
    queryKey: ['planned_inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventories').select('*').eq('id', id).single()
      if (error) throw error
      return data as PlannedInventory
    }
  })

  const { data: sectors = [] } = useQuery({
    queryKey: ['planned_inventory_sectors', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_sectors').select('*').eq('inventory_id', id).order('created_at', { ascending: true })
      if (error) throw error
      return data as PlannedInventorySector[]
    }
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['planned_inventory_areas', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_areas').select('*').eq('inventory_id', id).order('area_number', { ascending: true })
      if (error) throw error
      return data as PlannedInventoryArea[]
    }
  })

  // Para mostrar Qtd Itens
  const { data: counts = [] } = useQuery({
    queryKey: ['planned_inventory_counts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_counts').select('area_id, quantity').eq('inventory_id', id)
      if (error) throw error
      return data as { area_id: string, quantity: number }[]
    }
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data as Product[]
    }
  })

  if (!inventory) return <div className="p-8 text-center">Carregando inventário...</div>

  if (inventory.status !== 'in_progress') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center slide-in">
        <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Inventário Indisponível</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Este inventário não está liberado para contagem no momento. Fale com seu gestor.
        </p>
        <Button onClick={() => navigate('/contagens/planejados')}>Voltar para Lista</Button>
      </div>
    )
  }

  // Lista de Áreas agrupadas por Setor
  if (!selectedAreaId) {
    return (
      <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-3 bg-blue-500 text-white p-4 -mx-4 -mt-6 mb-4 md:rounded-b-lg shadow-md">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contagens/planejados')} className="shrink-0 text-white hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center font-medium text-lg">
            {inventory.name}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/20 hover:text-white opacity-0 cursor-default">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {sectors.length === 0 ? (
          <div className="text-center py-10">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum setor mapeado neste inventário.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sectors.map(sector => {
              const sectorAreas = areas.filter(a => a.sector_id === sector.id)
              if (sectorAreas.length === 0) return null

              return (
                <div key={sector.id} className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    {sector.name}
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                    {sectorAreas.map((area, idx) => {
                      const areaQty = counts.filter(c => c.area_id === area.id).reduce((sum, c) => sum + c.quantity, 0)
                      
                      let indicatorColor = 'bg-red-500'
                      let bgColor = 'bg-muted'
                      let iconColor = 'text-foreground'
                      let statusText = 'Aguardando'
                      
                      if (area.status === 'completed') {
                        indicatorColor = 'bg-emerald-500'
                        bgColor = 'bg-emerald-500/10'
                        iconColor = 'text-emerald-600'
                        statusText = 'Finalizada'
                      } else if (area.status === 'in_progress' || areaQty > 0) {
                        indicatorColor = 'bg-amber-500'
                        bgColor = 'bg-amber-500/10'
                        iconColor = 'text-amber-600'
                        statusText = 'Em andamento'
                      }
                      
                      return (
                        <div 
                          key={area.id} 
                          onClick={() => setSelectedAreaId(area.id)}
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${idx !== sectorAreas.length - 1 ? 'border-b border-border/50' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`${bgColor} p-2 rounded-full relative`}>
                              <ScanBarcode className={`h-6 w-6 ${iconColor}`} />
                              <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-2 border-background rounded-full ${indicatorColor}`}></div>
                            </div>
                            <div>
                              <div className="font-bold text-foreground">Area #{area.area_number} <span className="text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{statusText}</span></div>
                              <div className="text-xs text-muted-foreground">Qtd Itens: {areaQty}</div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const selectedArea = areas.find(a => a.id === selectedAreaId)

  return (
    <AreaCountView 
      inventory={inventory}
      area={selectedArea!}
      allProducts={allProducts}
      user={user}
      onBack={() => setSelectedAreaId(null)}
    />
  )
}


// --- SUB-COMPONENTE DE BIPAGEM POR ÁREA ---
function AreaCountView({ inventory, area, allProducts, user, onBack }: { 
  inventory: PlannedInventory, area: PlannedInventoryArea, allProducts: Product[], user: any, onBack: () => void 
}) {
  const queryClient = useQueryClient()
  const scanRef = useRef<HTMLInputElement>(null)
  
  const [scanInput, setScanInput] = useState('')
  const [searchAddInput, setSearchAddInput] = useState('')
  const [manualQty, setManualQty] = useState<number | ''>(1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
  const [extraInfo, setExtraInfo] = useState('')
  const [keepExtraInfo, setKeepExtraInfo] = useState(true)
  const [askAfterScan, setAskAfterScan] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const extraInfoRef = useRef<HTMLInputElement>(null)

  const { data: counts = [] } = useQuery({
    queryKey: ['planned_inventory_counts', inventory.id, area.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planned_inventory_counts')
        .select('*')
        .eq('inventory_id', inventory.id)
        .eq('area_id', area.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as PlannedInventoryCount[]
    }
  })

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  useEffect(() => { scanRef.current?.focus() }, [])

  useEffect(() => {
    if (searchAddInput.trim().length > 0) {
      const term = normalizeCode(searchAddInput.trim());
      const filtered = allProducts.filter(p => 
        normalizeCode(p.code).includes(term) || 
        (p.external_code && normalizeCode(p.external_code).includes(term)) || 
        normalizeCode(p.description).includes(term)
      ).slice(0, 10);
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  }, [searchAddInput, allProducts]);

  const addItemMutation = useMutation({
    mutationFn: async ({ productCode, qty = 1, extra = '' }: { productCode: string, qty?: number, extra?: string }) => {
      const existing = counts.find(c => c.product_code === productCode && (c.extra_info || '') === (extra || ''))
      if (existing) {
        const { error } = await supabase.from('planned_inventory_counts')
          .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('planned_inventory_counts')
          .insert([{
            inventory_id: inventory.id,
            area_id: area.id,
            product_code: productCode,
            quantity: qty,
            extra_info: extra || null,
            user_name: user?.name || 'Operador'
          }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_counts'] })
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
        audio.play().catch(() => {})
        if (navigator.vibrate) navigator.vibrate(50)
      } catch (e) {}
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string, qty: number }) => {
      const { error } = await supabase.from('planned_inventory_counts')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planned_inventory_counts'] }),
    onError: (error: any) => toast.error(`Erro ao atualizar quantidade: ${error.message}`)
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('planned_inventory_counts').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_counts'] })
      toast.success('Item removido')
    },
    onError: (error: any) => toast.error(`Erro ao apagar item: ${error.message}`)
  })

  const updateAreaStatusMutation = useMutation({
    mutationFn: async (status: 'pending' | 'in_progress' | 'completed') => {
      const { error } = await supabase.from('planned_inventory_areas')
        .update({ status })
        .eq('id', area.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas'] })
      toast.success('Status da área atualizado')
    },
    onError: (error: any) => toast.error(`Erro ao atualizar status: ${error.message}`)
  })

  const processScannedBarcode = (raw: string) => {
    if (!raw.trim()) return
    
    let qty = typeof manualQty === 'number' ? manualQty : 1
    let rawCode = raw.trim()

    if (rawCode.includes('*')) {
      const parts = rawCode.split('*')
      const parsedQty = parseInt(parts[0], 10)
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty
        rawCode = parts[1] || ''
      }
    }

    const code = normalizeCode(rawCode)
    const product = allProducts.find(p => normalizeCode(p.code) === code || (p.external_code && normalizeCode(p.external_code) === code))
    
    if (!product) {
      if (inventory.collection_rule === 'registered_only') {
        toast.error('Produto não cadastrado no sistema!')
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        return
      }

      if (inventory.collection_rule === 'confirm_unknown') {
        if (!confirm(`Código ${rawCode} não existe no sistema. Deseja registrar como Desconhecido?`)) {
          return
        }
      }

      // Se for 'any' ou se confirmou
      addItemMutation.mutate({ productCode: rawCode, qty, extra: extraInfo.trim() })
      return
    }

    addItemMutation.mutate({ productCode: product.code, qty, extra: extraInfo.trim() })
  }

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!scanInput.trim() && !searchAddInput.trim()) return
    const input = scanInput.trim() || searchAddInput.trim()
    
    if (askAfterScan) {
      setShowExtra(true)
      setTimeout(() => extraInfoRef.current?.focus(), 50)
      return
    }
    
    processScannedBarcode(input)
    setScanInput('')
    setSearchAddInput('')
    setManualQty(1)
    if (!keepExtraInfo) setExtraInfo('')
  }
  
  const submitWithExtraInfo = () => {
    const input = scanInput.trim() || searchAddInput.trim()
    if (!input) return
    processScannedBarcode(input)
    setScanInput('')
    setSearchAddInput('')
    setManualQty(1)
    if (!keepExtraInfo) setExtraInfo('')
    scanRef.current?.focus()
  }

  const handleManualAdd = (rawCode: string) => {
    if (!rawCode.trim()) return
    
    let qty = typeof manualQty === 'number' ? manualQty : 1
    let searchStr = rawCode.trim()

    if (searchStr.includes('*')) {
      const parts = searchStr.split('*')
      const parsedQty = parseInt(parts[0], 10)
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty
        searchStr = parts[1] || ''
      }
    }

    const term = normalizeCode(searchStr)
    const product = allProducts.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    
    if (!product) {
      if (inventory.collection_rule === 'registered_only') {
        toast.error('Produto não encontrado com esse código exato')
        return
      }
      if (inventory.collection_rule === 'confirm_unknown') {
        if (!confirm(`Código ${searchStr} não encontrado. Deseja registrar mesmo assim?`)) {
          return
        }
      }
      
      addItemMutation.mutate({ productCode: searchStr, qty, extra: extraInfo.trim() })
      setSearchAddInput('')
      setScanInput('')
      setManualQty(1)
      setShowDropdown(false)
      if (!keepExtraInfo) setExtraInfo('')
      return
    }
    
    addItemMutation.mutate({ productCode: product.code, qty, extra: extraInfo.trim() })
    setSearchAddInput('')
    setScanInput('')
    setManualQty(1)
    setShowDropdown(false)
    if (!keepExtraInfo) setExtraInfo('')
  }

  const handleManualSelect = (product: Product) => {
    const qty = typeof manualQty === 'number' ? manualQty : 1
    
    if (askAfterScan) {
      // Se selecionou manual mas pede pra focar a extra info
      setSearchAddInput(product.code) // Coloca o código do produto no input para ser lido depois
      setShowExtra(true)
      setTimeout(() => extraInfoRef.current?.focus(), 50)
      return
    }
    
    addItemMutation.mutate({ productCode: product.code, qty, extra: extraInfo.trim() })
    setSearchAddInput('')
    setScanInput('')
    setManualQty(1)
    setShowDropdown(false)
    if (!keepExtraInfo) setExtraInfo('')
  }

  const totalItems = counts.reduce((acc, curr) => acc + curr.quantity, 0)
  const isCompleted = area.status === 'completed'

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 slide-in flex flex-col min-h-screen">
      <div className="flex items-center gap-3 bg-blue-500 text-white p-4 -mx-4 -mt-6 mb-2 md:rounded-b-lg shadow-md shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 text-white hover:bg-white/20 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-xl font-bold truncate">Area #{area.area_number}</h1>
          <p className="text-sm text-white/80 truncate">{inventory.name}</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="space-y-4 shrink-0">
        {isCompleted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-emerald-700 dark:text-emerald-500">Área Finalizada</h3>
            <p className="text-sm text-emerald-600/80 mb-4">Esta área já teve sua contagem concluída.</p>
            <Button 
              variant="outline" 
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 w-full max-w-xs mx-auto"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja reabrir esta área para bipagem?')) {
                  updateAreaStatusMutation.mutate('in_progress')
                }
              }}
              disabled={updateAreaStatusMutation.isPending}
            >
              Reabrir Área
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-card px-4 py-3 pb-4 shadow-sm border border-border/50 md:rounded-lg">
          <div className="flex gap-4 items-end border-b-2 border-primary/20 pb-2 focus-within:border-primary transition-colors relative">
            <div className="w-16 shrink-0">
              <label className="text-[11px] text-muted-foreground font-medium block mb-0.5">Qtd</label>
              <Input
                type="number"
                min="1"
                value={manualQty}
                onChange={e => setManualQty(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                className="h-8 text-xl font-bold p-0 border-0 focus-visible:ring-0 bg-transparent shadow-none w-full"
              />
            </div>
            <div className="h-8 w-px bg-border shrink-0 mb-1" />
            <div className="flex-1 relative">
              <Input 
                ref={scanRef}
                value={searchAddInput}
                onChange={e => {
                  setSearchAddInput(e.target.value)
                  setScanInput(e.target.value)
                }}
                placeholder="Cod. de Barras"
                className="h-8 text-xl p-0 border-0 focus-visible:ring-0 bg-transparent shadow-none w-full placeholder:text-muted-foreground/40"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!searchAddInput.trim()) return
                    
                    const isNameSearch = isNaN(Number(searchAddInput.replace(/\*/g, ''))) && searchAddInput.length > 3
                    if (isNameSearch && filteredProducts.length === 1 && normalizeCode(filteredProducts[0].code) === normalizeCode(searchAddInput.trim())) {
                      handleManualSelect(filteredProducts[0])
                    } else if (isNameSearch && filteredProducts.length > 0) {
                      // Let user select from dropdown
                    } else {
                      handleScan()
                    }
                  }
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => { if (searchAddInput.trim().length > 0) setShowDropdown(true) }}
              />
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 z-20 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col" onClick={() => handleManualSelect(p)}>
                      <span className="text-sm font-medium">{p.description}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground absolute right-0 bottom-1 hover:text-primary hover:bg-primary/10">
              <Camera className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4">
            <button 
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 text-[15px] text-foreground hover:text-primary transition-colors w-full"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showExtra ? 'rotate-90' : ''}`} />
              Informação extra:
            </button>
            
            {showExtra && (
              <div className="mt-3 bg-muted/10 p-4 rounded-xl border border-border/50 animate-in slide-in-from-top-2">
                <Input 
                  ref={extraInfoRef}
                  value={extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  placeholder="Informação extra, lote, local etc..."
                  className="border-0 border-b-2 border-foreground/30 hover:border-foreground/50 rounded-none focus-visible:ring-0 px-0 bg-transparent mb-4 shadow-none text-[15px]"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitWithExtraInfo()
                    }
                  }}
                />
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-[15px] cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={keepExtraInfo}
                        onChange={e => setKeepExtraInfo(e.target.checked)}
                        className="peer appearance-none w-6 h-6 border-2 border-foreground/30 rounded bg-transparent checked:bg-transparent checked:border-foreground transition-all"
                      />
                      <svg className="absolute w-4 h-4 text-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Incluir em todas leituras seguintes
                  </label>
                  <label className="flex items-center gap-3 text-[15px] cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={askAfterScan}
                        onChange={e => setAskAfterScan(e.target.checked)}
                        className="peer appearance-none w-6 h-6 border-2 border-foreground/30 rounded bg-transparent checked:bg-transparent checked:border-foreground transition-all"
                      />
                      <svg className="absolute w-4 h-4 text-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    Solicitar após leitura
                  </label>
                </div>
              </div>
            )}
          </div>
          </div>
            
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-12 text-base font-bold"
              onClick={() => {
                if (counts.length === 0) {
                  if (!window.confirm('Esta área não possui itens bipados. Tem certeza que deseja finalizar vazia?')) return
                } else {
                  if (!window.confirm('Deseja realmente finalizar a contagem desta área?')) return
                }
                updateAreaStatusMutation.mutate('completed')
              }}
              disabled={updateAreaStatusMutation.isPending}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Finalizar Área
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-card rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border border-border/50">
        <div className="flex justify-between items-end mb-2 px-4 pt-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Itens na Área ({counts.length})</h3>
          <span className="font-mono text-sm font-bold text-blue-600">Total: {totalItems} un</span>
        </div>
        
        {counts.length === 0 ? (
          <div className="text-center py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
            <LayoutGrid className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhuma coleta nesta área</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-4 px-3">
            {counts.map((item, i) => {
              const product = allProducts.find(p => p.code === item.product_code)
              return (
                <div key={item.id} className="bg-background border border-border/50 p-3 flex items-center justify-between rounded-lg shadow-sm slide-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium truncate text-foreground text-sm">
                      {product?.description || <span className="text-amber-500 italic">Produto Desconhecido</span>}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                      {item.extra_info && (
                        <span className="text-[11px] bg-muted w-fit px-1.5 py-0.5 rounded text-muted-foreground">
                          {item.extra_info}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input 
                      type="number"
                      min="1"
                      defaultValue={item.quantity}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val > 0 && val !== item.quantity) {
                          updateItemMutation.mutate({ itemId: item.id, qty: val })
                        } else {
                          e.target.value = item.quantity.toString()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                      className="w-16 h-8 text-center font-bold text-blue-600 bg-blue-500/5 border-blue-500/20 p-0"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja apagar este item da contagem?')) {
                          deleteItemMutation.mutate(item.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={processScannedBarcode}
      />
    </div>
  )
}
