import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AdhocCount, AdhocCountItem, Product } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { Plus, ScanLine, Search, CheckCircle2, ArrowLeft, Download, FileSpreadsheet, ClipboardList, Trash2, Camera } from 'lucide-react'
import * as XLSX from 'xlsx'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'

export default function AdhocCountPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeCountId, setActiveCountId] = useState<string | null>(null)
  
  // Data Fetching
  const { data: counts = [] } = useQuery({
    queryKey: ['adhoc_counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('adhoc_counts').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as AdhocCount[]
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

  // Mutations
  const createCountMutation = useMutation({
    mutationFn: async () => {
      // Formato: "Coleta nº XXX - dia XX/XX/XXXX"
      const dateStr = new Date().toLocaleDateString('pt-BR')
      const countNum = String(counts.length + 1).padStart(3, '0')
      const countName = `Coleta nº ${countNum} - dia ${dateStr}`
      
      const { data, error } = await supabase.from('adhoc_counts').insert([{
        count_number: countName,
        user_name: user?.name || 'Usuário',
        status: 'in_progress'
      }]).select()
      
      if (error) throw error
      if (!data || data.length === 0) throw new Error("Inserção falhou silenciosamente (verifique RLS no Supabase)")
      return data[0] as AdhocCount
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adhoc_counts'] })
      setActiveCountId(data.id)
      toast.success('Contagem iniciada')
    },
    onError: (error: any) => {
      if (error.message?.includes('relation "adhoc_counts" does not exist')) {
        toast.error('O banco de dados não possui as tabelas necessárias. Execute o script SQL no Supabase!')
      } else {
        toast.error(`Erro ao criar: ${error.message}`)
      }
    }
  })

  const deleteCountMutation = useMutation({
    mutationFn: async (countId: string) => {
      const { error } = await supabase.from('adhoc_counts').delete().eq('id', countId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adhoc_counts'] })
      toast.success('Contagem excluída com sucesso')
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`)
    }
  })

  const exportToExcel = async (count: AdhocCount) => {
    try {
      const { data: items, error } = await supabase.from('adhoc_count_items').select('*').eq('count_id', count.id)
      if (error) throw error
      
      if (!items || items.length === 0) {
        toast.error('Nenhum item nesta contagem para exportar.')
        return
      }

      const rows = items.map((item: AdhocCountItem) => ({
        'Nº da Coleta': count.count_number,
        'Data': new Date(count.created_at).toLocaleDateString('pt-BR'),
        'Usuário': count.user_name,
        'Código do Produto': item.product_code,
        'Descrição': item.description,
        'Grupo': item.group_category || '',
        'Quantidade Conferida': item.quantity
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Contagem")
      XLSX.writeFile(wb, `Contagem_${count.count_number.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
      toast.success('Arquivo exportado com sucesso!')
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`)
    }
  }

  // View active count
  if (activeCountId) {
    return <ActiveCountView 
             countId={activeCountId} 
             allProducts={allProducts} 
             onBack={() => setActiveCountId(null)} 
             user={user}
           />
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contagens')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Contagem Avulsa</h1>
          <p className="text-muted-foreground mt-1 text-sm">Histórico e novas coletas</p>
        </div>
      </div>

      {isManager && (
        <div className="flex gap-2">
          <Button 
            className="flex-1 h-12 text-lg" 
            onClick={() => createCountMutation.mutate()}
            disabled={createCountMutation.isPending}
          >
            <Plus className="mr-2 h-5 w-5" /> Nova Contagem
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Minhas Contagens
        </h2>
        {counts.length === 0 ? (
          <div className="glass-card text-center py-10">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma contagem encontrada</p>
          </div>
        ) : (
          counts.map(count => (
            <Card key={count.id} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors glass-card cursor-pointer">
              <CardContent className="p-4" onClick={(e) => {
                // If clicked on export button, don't open
                if ((e.target as HTMLElement).closest('.export-btn')) return;
                setActiveCountId(count.id)
              }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base truncate pr-2">{count.count_number}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span>👤 {count.user_name}</span>
                      <span>•</span>
                      <span>📅 {new Date(count.created_at).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${count.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400' : 'bg-primary/15 text-primary'}`}>
                      {count.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="export-btn h-8 w-8 text-muted-foreground hover:text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={(e) => { e.stopPropagation(); exportToExcel(count) }}
                      title="Exportar para Excel"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isManager && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="export-btn h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (window.confirm('Tem certeza que deseja APAGAR esta contagem definitivamente?')) {
                            deleteCountMutation.mutate(count.id)
                          }
                        }}
                        disabled={deleteCountMutation.isPending}
                        title="Apagar Contagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Sub-component: ActiveCountView
// ------------------------------------------------------------------------------------------
function ActiveCountView({ countId, allProducts, onBack, user }: { countId: string, allProducts: Product[], onBack: () => void, user: any }) {
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
  
  // Data Fetching for current count
  const { data: count } = useQuery({
    queryKey: ['adhoc_count', countId],
    queryFn: async () => {
      const { data, error } = await supabase.from('adhoc_counts').select('*').eq('id', countId).single()
      if (error) throw error
      return data as AdhocCount
    }
  })

  const { data: items = [] } = useQuery({
    queryKey: ['adhoc_count_items', countId],
    queryFn: async () => {
      const { data, error } = await supabase.from('adhoc_count_items').select('*').eq('count_id', countId).order('updated_at', { ascending: false })
      if (error) throw error
      return data as AdhocCountItem[]
    }
  })

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  // Focus scanner on mount
  useEffect(() => { scanRef.current?.focus() }, [])

  // Dropdown filtering
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

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'completed') => {
      const { error } = await supabase.from('adhoc_counts').update({ status }).eq('id', countId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adhoc_counts'] })
      queryClient.invalidateQueries({ queryKey: ['adhoc_count', countId] })
      toast.success('Contagem finalizada com sucesso!')
    }
  })

  const addItemMutation = useMutation({
    mutationFn: async ({ product, qty = 1, extra = '' }: { product: Product, qty?: number, extra?: string }) => {
      const existing = items.find(i => i.product_code === product.code && (i.extra_info || '') === (extra || ''))
      if (existing) {
        const { error } = await supabase.from('adhoc_count_items')
          .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('adhoc_count_items')
          .insert([{
            count_id: countId,
            product_code: product.code,
            description: product.description,
            group_category: product.group_name || '',
            quantity: qty,
            extra_info: extra || null
          }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adhoc_count_items', countId] })
      // Play success beep
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU') // short beep placeholder
        audio.play().catch(() => {})
        if (navigator.vibrate) navigator.vibrate(50)
      } catch (e) {}
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar: ${error.message}`)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string, qty: number }) => {
      const { error } = await supabase.from('adhoc_count_items')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adhoc_count_items', countId] }),
    onError: (error: any) => toast.error(`Erro ao atualizar quantidade: ${error.message}`)
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('adhoc_count_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adhoc_count_items', countId] })
      toast.success('Item removido')
    },
    onError: (error: any) => toast.error(`Erro ao apagar item: ${error.message}`)
  })

  const processScannedBarcode = (raw: string) => {
    if (!raw.trim() || count?.status === 'completed') return
    
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
      toast.error('Produto não encontrado')
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      return
    }
    addItemMutation.mutate({ product, qty, extra: extraInfo.trim() })
  }

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!scanInput.trim() && !searchAddInput.trim() || count?.status === 'completed') return
    const input = scanInput.trim() || searchAddInput.trim()
    
    if (askAfterScan) {
      setShowExtra(true)
      setTimeout(() => extraInfoRef.current?.focus(), 50)
      return
    }
    
    processScannedBarcode(input)
    setScanInput('')
    setSearchAddInput('')
    if (!keepExtraInfo) setExtraInfo('')
  }
  
  const submitWithExtraInfo = () => {
    const input = scanInput.trim() || searchAddInput.trim()
    if (!input || count?.status === 'completed') return
    processScannedBarcode(input)
    setScanInput('')
    setSearchAddInput('')
    if (!keepExtraInfo) setExtraInfo('')
    scanRef.current?.focus()
  }

  const handleManualAdd = (rawCode: string) => {
    if (!rawCode.trim() || count?.status === 'completed') return
    
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
    
    addItemMutation.mutate({ product, qty, extra: extraInfo.trim() })
    setSearchAddInput('')
    setScanInput('')
    setManualQty(1)
    setShowDropdown(false)
    if (!keepExtraInfo) setExtraInfo('')
  }

  const handleManualSelect = (product: Product) => {
    if (count?.status === 'completed') return
    const qty = typeof manualQty === 'number' ? manualQty : 1
    
    if (askAfterScan) {
      // Se selecionou manual mas pede pra focar a extra info
      setSearchAddInput(product.code) // Coloca o código do produto no input para ser lido depois
      setShowExtra(true)
      setTimeout(() => extraInfoRef.current?.focus(), 50)
      return
    }
    
    addItemMutation.mutate({ product, qty, extra: extraInfo.trim() })
    setSearchAddInput('')
    setScanInput('')
    setManualQty(1)
    setShowDropdown(false)
    if (!keepExtraInfo) setExtraInfo('')
  }

  if (!count) return <div className="p-8 text-center">Carregando...</div>

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0)
  const isCompleted = count.status === 'completed'

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 slide-in flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/50 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate gradient-text">{count.count_number}</h1>
          <p className="text-sm text-muted-foreground truncate">{new Date(count.created_at).toLocaleDateString('pt-BR')} • {count.user_name}</p>
        </div>
        {isCompleted && (
          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold shrink-0">
            Finalizado
          </span>
        )}
      </div>

      {/* Scanner & Manual Add */}
      {!isCompleted && (
        <div className="space-y-4 shrink-0">
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
                  className="h-8 text-xl p-0 border-0 focus-visible:ring-0 bg-transparent shadow-none w-full placeholder:text-muted-foreground/40 font-mono"
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
                      <div 
                        key={p.id} 
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => handleManualSelect(p)}
                      >
                        <span className="text-sm font-medium">{p.description}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && searchAddInput.trim().length > 0 && filteredProducts.length === 0 && (
                  <div className="absolute top-full left-0 z-20 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado
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
        </div>
      )}

      {/* List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end mb-2 px-1">
          <h3 className="font-bold text-sm text-muted-foreground">Itens Bipados ({items.length})</h3>
          <span className="font-mono text-sm font-bold text-primary">Total: {totalItems} un</span>
        </div>
        
        {items.length === 0 ? (
          <div className="glass-card text-center py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
            <ScanLine className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhum item bipado ainda</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-4">
            {items.map((item, i) => (
              <div key={item.id} className="glass-card p-3 flex items-center justify-between slide-up border-primary/20 bg-primary/5" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">{item.description}</p>
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
                  {isCompleted ? (
                    <div className="text-right">
                      <span className="text-lg font-bold font-mono text-primary">+{item.quantity}</span>
                    </div>
                  ) : (
                    <>
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
                        className="w-16 h-8 text-center font-bold text-primary bg-primary/5 border-primary/20 p-0"
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Button */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 md:sticky md:bottom-0 md:bg-transparent md:border-none md:p-0 md:pt-4">
          <Button 
            className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" 
            onClick={() => {
              if (window.confirm('Tem certeza que deseja finalizar esta contagem?')) {
                updateStatusMutation.mutate('completed')
              }
            }}
            disabled={updateStatusMutation.isPending || items.length === 0}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar Contagem
          </Button>
        </div>
      )}

      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={processScannedBarcode}
      />
    </div>
  )
}
