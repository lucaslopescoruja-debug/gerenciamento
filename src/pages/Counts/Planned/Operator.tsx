import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory, PlannedInventoryArea, PlannedInventoryCount, Product } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, ScanLine, Search, CheckCircle2, ArrowRight, LayoutGrid, Camera } from 'lucide-react'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'

export default function PlannedInventoryOperator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)

  const { data: inventory } = useQuery({
    queryKey: ['planned_inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventories').select('*').eq('id', id).single()
      if (error) throw error
      return data as PlannedInventory
    }
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['planned_inventory_areas', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_areas').select('*').eq('inventory_id', id).order('created_at', { ascending: true })
      if (error) throw error
      return data as PlannedInventoryArea[]
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

  // Se não escolheu a área ainda
  if (!selectedAreaId) {
    return (
      <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contagens/planejados')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">Escolha a Área</h1>
            <p className="text-muted-foreground mt-1 text-sm">{inventory.name}</p>
          </div>
        </div>

        {areas.length === 0 ? (
          <div className="text-center py-10">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma área cadastrada neste inventário.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {areas.map(area => (
              <Card key={area.id} className="cursor-pointer hover:border-primary/50 transition-colors border-primary/20" onClick={() => setSelectedAreaId(area.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-bold text-lg">{area.name}</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const selectedArea = areas.find(a => a.id === selectedAreaId)

  // Se escolheu a área, mostra o sub-componente de bipagem
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

  // Items bipados nesta área (e neste inventário)
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
    mutationFn: async ({ product, qty = 1 }: { product: Product, qty?: number }) => {
      // Procura se já tem esse produto bipado nesta área
      const existing = counts.find(c => c.product_code === product.code)
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
            product_code: product.code,
            quantity: qty,
            user_name: user?.name || 'Operador'
          }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_counts', inventory.id, area.id] })
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
        audio.play().catch(() => {})
        if (navigator.vibrate) navigator.vibrate(50)
      } catch (e) {}
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar: ${error.message}`)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  })

  const processScannedBarcode = (raw: string) => {
    if (!raw.trim()) return
    
    let qty = 1
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
      toast.error('Produto não cadastrado no sistema!')
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      return
    }
    addItemMutation.mutate({ product, qty })
  }

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    processScannedBarcode(scanInput.trim())
    setScanInput('')
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
    if (!product) { toast.error('Produto não encontrado com esse código exato'); return }
    
    addItemMutation.mutate({ product, qty })
    setSearchAddInput('')
    setManualQty(1)
    setShowDropdown(false)
  }

  const handleManualSelect = (product: Product) => {
    const qty = typeof manualQty === 'number' ? manualQty : 1
    addItemMutation.mutate({ product, qty })
    setSearchAddInput('')
    setManualQty(1)
    setShowDropdown(false)
  }

  const totalItems = counts.reduce((acc, curr) => acc + curr.quantity, 0)

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 slide-in flex flex-col min-h-screen">
      <div className="flex items-center gap-3 pb-2 border-b border-border/50 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate gradient-text">{area.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{inventory.name}</p>
        </div>
      </div>

      <div className="space-y-4 shrink-0">
        <Card className="border-blue-500/20">
          <CardContent className="p-4">
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-blue-500/50 scan-pulse" />
                <Input 
                  ref={scanRef} 
                  value={scanInput} 
                  onChange={e => setScanInput(e.target.value)} 
                  placeholder="Bipar código..." 
                  className="pl-11 h-12 text-lg font-mono border-blue-500/30 focus-visible:ring-blue-500" 
                  autoFocus 
                />
              </div>
              <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="outline" className="h-12 w-12 border-blue-500/30 text-blue-500 hover:bg-blue-500/10" title="Usar câmera"><Camera className="h-5 w-5" /></Button>
              <Button type="submit" size="icon" className="h-12 w-12 bg-blue-600 hover:bg-blue-700" disabled={addItemMutation.isPending}><Search className="h-5 w-5" /></Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex gap-2 relative">
          <Input
            type="number"
            min="1"
            value={manualQty}
            onChange={e => setManualQty(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
            className="w-20 text-center font-bold h-10"
            placeholder="Qtd"
            title="Quantidade"
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchAddInput} 
              onChange={e => setSearchAddInput(e.target.value)} 
              placeholder="Busca manual..." 
              className="pl-9 bg-background/50 h-10"
              onKeyDown={e => { 
                if (e.key === 'Enter') { 
                  e.preventDefault(); 
                  if (filteredProducts.length === 1 && normalizeCode(filteredProducts[0].code) === normalizeCode(searchAddInput.trim())) {
                    handleManualSelect(filteredProducts[0]);
                  } else {
                    handleManualAdd(searchAddInput);
                  }
                } 
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => { if (searchAddInput.trim().length > 0) setShowDropdown(true) }}
            />
            
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col" onClick={() => handleManualSelect(p)}>
                    <span className="text-sm font-medium">{p.description}</span>
                    <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button className="h-10 w-10 p-0 shrink-0 bg-blue-600 hover:bg-blue-700" onClick={() => handleManualAdd(searchAddInput)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end mb-2 px-1">
          <h3 className="font-bold text-sm text-muted-foreground">Coletas na Área ({counts.length})</h3>
          <span className="font-mono text-sm font-bold text-blue-500">Total: {totalItems} un</span>
        </div>
        
        {counts.length === 0 ? (
          <div className="glass-card text-center py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
            <LayoutGrid className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhuma coleta nesta área</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-4">
            {counts.map((item, i) => {
              const product = allProducts.find(p => p.code === item.product_code)
              return (
                <div key={item.id} className="glass-card p-3 flex items-center justify-between slide-up border-blue-500/20 bg-blue-500/5" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium truncate text-foreground">{product?.description || 'Produto Desconhecido'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-lg font-bold font-mono text-blue-500">+{item.quantity}</span>
                    </div>
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
