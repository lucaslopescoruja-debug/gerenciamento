import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { InventoryCount, InventoryCountItem, Product } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, ScanLine, Search, CheckCircle2, ArrowLeft, Boxes, AlertTriangle, Check, ShieldAlert, Edit2, X } from 'lucide-react'

export default function InventoryCountPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeCountId, setActiveCountId] = useState<string | null>(null)
  
  // Data Fetching
  const { data: counts = [] } = useQuery({
    queryKey: ['inventory_counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_counts').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as InventoryCount[]
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
      const dateStr = new Date().toLocaleDateString('pt-BR')
      const countNum = String(counts.length + 1).padStart(3, '0')
      const countName = `Inventário nº ${countNum} - dia ${dateStr}`
      
      const { data, error } = await supabase.from('inventory_counts').insert([{
        count_number: countName,
        user_name: user?.name || 'Usuário',
        status: 'in_progress'
      }]).select()
      
      if (error) throw error
      if (!data || data.length === 0) throw new Error("Inserção falhou silenciosamente (verifique RLS no Supabase)")
      return data[0] as InventoryCount
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_counts'] })
      setActiveCountId(data.id)
      toast.success('Inventário iniciado')
    },
    onError: (error: any) => {
      if (error.message?.includes('relation "inventory_counts" does not exist')) {
        toast.error('O banco de dados não possui as tabelas necessárias. Execute o script SQL no Supabase!')
      } else {
        toast.error(`Erro ao criar: ${error.message}`)
      }
    }
  })

  if (activeCountId) {
    return <ActiveInventoryView 
             countId={activeCountId} 
             allProducts={allProducts} 
             onBack={() => setActiveCountId(null)} 
             user={user}
             isManager={isManager}
           />
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contagens')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Inventário Geral</h1>
          <p className="text-muted-foreground mt-1 text-sm">Contagem e reconciliação de saldo</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          className="flex-1 h-12 text-lg bg-amber-600 hover:bg-amber-700 text-white" 
          onClick={() => createCountMutation.mutate()}
          disabled={createCountMutation.isPending}
        >
          <Plus className="mr-2 h-5 w-5" /> Novo Inventário
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Boxes className="h-5 w-5 text-amber-500" /> Histórico de Inventários
        </h2>
        {counts.length === 0 ? (
          <div className="glass-card text-center py-10">
            <Boxes className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum inventário encontrado</p>
          </div>
        ) : (
          counts.map(count => (
            <Card key={count.id} className="overflow-hidden border-amber-500/20 hover:border-amber-500/50 transition-colors glass-card cursor-pointer" onClick={() => setActiveCountId(count.id)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base truncate pr-2 text-amber-500">{count.count_number}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span>👤 {count.user_name}</span>
                      <span>•</span>
                      <span>📅 {new Date(count.created_at).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      count.status === 'adjusted' ? 'bg-blue-500/15 text-blue-500' :
                      count.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 
                      'bg-amber-500/15 text-amber-500'
                    }`}>
                      {count.status === 'adjusted' ? 'Ajustado' : count.status === 'completed' ? 'Aguardando Ajuste' : 'Em andamento'}
                    </span>
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
// Sub-component: ActiveInventoryView
// ------------------------------------------------------------------------------------------
function ActiveInventoryView({ countId, allProducts, onBack, user, isManager }: { countId: string, allProducts: Product[], onBack: () => void, user: any, isManager: boolean }) {
  const queryClient = useQueryClient()
  const scanRef = useRef<HTMLInputElement>(null)
  const [scanInput, setScanInput] = useState('')
  const [searchAddInput, setSearchAddInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<InventoryCountItem | null>(null)
  const [editQty, setEditQty] = useState(0)
  
  // Data Fetching
  const { data: count } = useQuery({
    queryKey: ['inventory_count', countId],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_counts').select('*').eq('id', countId).single()
      if (error) throw error
      return data as InventoryCount
    }
  })

  const { data: items = [] } = useQuery({
    queryKey: ['inventory_count_items', countId],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_count_items').select('*').eq('inventory_id', countId).order('updated_at', { ascending: false })
      if (error) throw error
      return data as InventoryCountItem[]
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

  // Generate Report (computed locally for 'completed' status)
  const report = useMemo(() => {
    if (count?.status !== 'completed' && count?.status !== 'adjusted') return []
    
    // Mix counted items and missing items
    const result: any[] = []
    
    // Add counted ones
    for (const item of items) {
      let status = 'ok'
      if (item.quantity_counted === 0 && item.quantity_system > 0) status = 'missing'
      else if (item.quantity_counted < item.quantity_system) status = 'divergent'
      else if (item.quantity_counted > item.quantity_system) status = 'excess'
      
      result.push({
        ...item,
        calc_status: status
      })
    }

    // Add missing ones from allProducts that were never scanned
    for (const p of allProducts) {
      if (!items.find(i => i.product_code === p.code)) {
        if (p.stock > 0) {
          result.push({
            id: `missing_${p.id}`,
            product_code: p.code,
            description: p.description,
            quantity_counted: 0,
            quantity_system: p.stock,
            calc_status: 'missing'
          })
        }
      }
    }
    
    return result
  }, [items, allProducts, count?.status])

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'completed' | 'adjusted' | 'in_progress') => {
      const updates: any = { status }
      if (status === 'adjusted') {
        updates.authorized_by = user.name
        updates.authorized_at = new Date().toISOString()
      }
      const { error } = await supabase.from('inventory_counts').update(updates).eq('id', countId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_counts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_count', countId] })
      if (variables === 'completed') toast.success('Inventário finalizado para conferência!')
      if (variables === 'adjusted') toast.success('Estoque ajustado com sucesso!')
      if (variables === 'in_progress') toast.success('Inventário reaberto para contagem!')
    }
  })

  const updateQtyMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string, qty: number }) => {
      const { error } = await supabase.from('inventory_count_items').update({ quantity_counted: qty, updated_at: new Date().toISOString() }).eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_count_items', countId] })
      setEditingItem(null)
      toast.success('Quantidade atualizada')
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`)
    }
  })

  const adjustStockMutation = useMutation({
    mutationFn: async () => {
      // Loop over report and update allProducts stock to quantity_counted
      const updates = report.map(r => {
        const p = allProducts.find(ap => ap.code === r.product_code)
        if (!p) return null
        return {
          id: p.id,
          stock: r.quantity_counted
        }
      }).filter(Boolean)

      // In a real prod environment we'd do a bulk upsert, here we loop because it's simpler
      for (const update of updates) {
        if (update) {
          await supabase.from('products').update({ stock: update.stock }).eq('id', update.id)
        }
      }
      
      // Also update the inventory_count_items status on DB
      for (const r of report) {
        if (!r.id.startsWith('missing_')) {
          await supabase.from('inventory_count_items').update({ status: r.calc_status }).eq('id', r.id)
        } else {
          // It was missing, we should insert it so it stays on record
          await supabase.from('inventory_count_items').insert([{
            inventory_id: countId,
            product_code: r.product_code,
            description: r.description,
            quantity_counted: 0,
            quantity_system: r.quantity_system,
            status: 'missing'
          }])
        }
      }
    },
    onSuccess: () => {
      // Now set the count status to adjusted
      updateStatusMutation.mutate('adjusted')
    },
    onError: (error: any) => {
      toast.error(`Erro ao ajustar estoque: ${error.message}`)
    }
  })

  const addItemMutation = useMutation({
    mutationFn: async ({ product, qty = 1 }: { product: Product, qty?: number }) => {
      const existing = items.find(i => i.product_code === product.code)
      if (existing) {
        const { error } = await supabase.from('inventory_count_items')
          .update({ quantity_counted: existing.quantity_counted + qty, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory_count_items')
          .insert([{
            inventory_id: countId,
            product_code: product.code,
            description: product.description,
            group_category: product.group_name || '',
            quantity_counted: qty,
            quantity_system: product.stock
          }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_count_items', countId] })
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

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim() || count?.status !== 'in_progress') return
    
    const raw = scanInput.trim()
    const code = normalizeCode(raw)
    setScanInput('')
    
    const product = allProducts.find(p => normalizeCode(p.code) === code || (p.external_code && normalizeCode(p.external_code) === code))
    if (!product) {
      toast.error('Produto não encontrado')
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      return
    }
    
    addItemMutation.mutate({ product })
  }

  const handleManualAdd = (rawCode: string) => {
    if (!rawCode.trim() || count?.status !== 'in_progress') return
    const term = normalizeCode(rawCode.trim())
    const product = allProducts.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    if (!product) { toast.error('Produto não encontrado com esse código exato'); return }
    
    addItemMutation.mutate({ product })
    setSearchAddInput('')
    setShowDropdown(false)
  }

  const handleManualSelect = (product: Product) => {
    if (count?.status !== 'in_progress') return
    addItemMutation.mutate({ product })
    setSearchAddInput('')
    setShowDropdown(false)
  }

  if (!count) return <div className="p-8 text-center">Carregando...</div>

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity_counted, 0)
  const isCompleted = count.status === 'completed'
  const isAdjusted = count.status === 'adjusted'
  const isFinished = isCompleted || isAdjusted

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 slide-in flex flex-col min-h-screen">
      <div className="flex items-center gap-3 pb-2 border-b border-border/50 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate gradient-text">{count.count_number}</h1>
          <p className="text-sm text-muted-foreground truncate">{new Date(count.created_at).toLocaleDateString('pt-BR')} • {count.user_name}</p>
        </div>
        {isAdjusted && <span className="bg-blue-500/15 text-blue-500 px-3 py-1 rounded-full text-xs font-bold shrink-0">Ajustado</span>}
        {isCompleted && <span className="bg-emerald-500/15 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold shrink-0">Aguardando Ajuste</span>}
      </div>

      {!isFinished && (
        <div className="space-y-4 shrink-0">
          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <form onSubmit={handleScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-amber-500/50 scan-pulse" />
                  <Input 
                    ref={scanRef} 
                    value={scanInput} 
                    onChange={e => setScanInput(e.target.value)} 
                    placeholder="Bipar código..." 
                    className="pl-11 h-12 text-lg font-mono border-amber-500/30 focus-visible:ring-amber-500" 
                    autoFocus 
                  />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12 bg-amber-600 hover:bg-amber-700" disabled={addItemMutation.isPending}><Search className="h-5 w-5" /></Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchAddInput} 
                onChange={e => setSearchAddInput(e.target.value)} 
                placeholder="Busca manual por código exato ou descrição..." 
                className="pl-9 bg-background/50"
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
            <Button onClick={() => handleManualAdd(searchAddInput)} className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* List while in progress */}
      {!isFinished && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-2 px-1">
            <h3 className="font-bold text-sm text-muted-foreground">Itens Bipados ({items.length})</h3>
            <span className="font-mono text-sm font-bold text-amber-500">Total: {totalItems} un</span>
          </div>
          
          {items.length === 0 ? (
            <div className="glass-card text-center py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
              <Boxes className="h-12 w-12 mb-3 opacity-30" />
              <p>Nenhum item bipado ainda</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pb-4">
              {items.map((item, i) => (
                <div key={item.id} className="glass-card p-3 flex flex-col gap-2 slide-up border-amber-500/20 bg-amber-500/5" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    {editingItem?.id !== item.id && (
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-bold font-mono text-amber-500">+{item.quantity_counted}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingItem(item); setEditQty(item.quantity_counted); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingItem?.id === item.id && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                      <Input 
                        type="number" 
                        value={editQty === 0 ? '' : editQty} 
                        onChange={e => setEditQty(Math.max(1, parseInt(e.target.value) || 0))} 
                        className="w-20 text-center font-mono h-9" 
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') updateQtyMutation.mutate({ itemId: item.id, qty: editQty }) }}
                      />
                      <Button size="sm" onClick={() => updateQtyMutation.mutate({ itemId: item.id, qty: editQty })} disabled={updateQtyMutation.isPending} className="bg-amber-600 hover:bg-amber-700">Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Finished Report View */}
      {isFinished && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Relatório de Divergências
            </h3>
            <div className="space-y-2">
              {report.map(r => {
                const isMissing = r.calc_status === 'missing'
                const isDivergent = r.calc_status === 'divergent'
                const isExcess = r.calc_status === 'excess'
                const isOk = r.calc_status === 'ok'
                
                return (
                  <div key={r.id} className={`glass-card p-3 flex flex-col gap-2 ${
                    isMissing ? 'border-red-500/30 bg-red-500/5' :
                    isDivergent ? 'border-amber-500/30 bg-amber-500/5' :
                    isExcess ? 'border-purple-500/30 bg-purple-500/5' :
                    'border-emerald-500/30 bg-emerald-500/5'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium text-sm text-foreground leading-tight">{r.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.product_code}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        isMissing ? 'bg-red-500/20 text-red-500' :
                        isDivergent ? 'bg-amber-500/20 text-amber-500' :
                        isExcess ? 'bg-purple-500/20 text-purple-400' :
                        'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {isMissing ? 'Faltante' : isDivergent ? 'Divergente' : isExcess ? 'Excedente' : 'OK'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm bg-background/50 rounded p-2">
                      <div className="flex-1 text-center border-r border-border/50">
                        <span className="text-xs text-muted-foreground block">Sistema</span>
                        <span className="font-mono font-bold">{r.quantity_system}</span>
                      </div>
                      <div className="flex-1 text-center border-r border-border/50">
                        <span className="text-xs text-muted-foreground block">Contado</span>
                        <span className={`font-mono font-bold ${
                          r.quantity_counted === r.quantity_system ? 'text-emerald-500' : 
                          r.quantity_counted > r.quantity_system ? 'text-purple-400' : 'text-amber-500'
                        }`}>{r.quantity_counted}</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs text-muted-foreground block">Diferença</span>
                        <span className={`font-mono font-bold ${
                          r.quantity_counted - r.quantity_system === 0 ? 'text-emerald-500' :
                          r.quantity_counted - r.quantity_system > 0 ? 'text-purple-400' : 'text-red-500'
                        }`}>
                          {r.quantity_counted - r.quantity_system > 0 ? '+' : ''}{r.quantity_counted - r.quantity_system}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {isAdjusted && (
            <div className="glass-card p-4 text-center border-blue-500/30">
              <Check className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-blue-500">Estoque Atualizado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Autorizado por {count.authorized_by} em {new Date(count.authorized_at || '').toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer Button */}
      {!isCompleted && !isAdjusted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 md:sticky md:bottom-0 md:bg-transparent md:border-none md:p-0 md:pt-4">
          <Button 
            className="w-full h-12 text-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white" 
            onClick={() => {
              if (window.confirm('Ao finalizar, o sistema irá comparar com o estoque atual. Tem certeza?')) {
                updateStatusMutation.mutate('completed')
              }
            }}
            disabled={updateStatusMutation.isPending || items.length === 0}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar Conferência
          </Button>
        </div>
      )}

      {isCompleted && isManager && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 md:sticky md:bottom-0 md:bg-transparent md:border-none md:p-0 md:pt-4 flex flex-col md:flex-row gap-2">
          <Button 
            variant="outline"
            className="flex-1 h-12 text-lg border-amber-500/50 text-amber-500 hover:bg-amber-500/10" 
            onClick={() => {
              if (window.confirm('Deseja reabrir este inventário para continuar contando?')) {
                updateStatusMutation.mutate('in_progress')
              }
            }}
            disabled={updateStatusMutation.isPending}
          >
            Reabrir p/ Contagem
          </Button>
          <Button 
            className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
            onClick={() => {
              if (window.confirm('CUIDADO: Isso irá substituir o saldo no banco de dados com base na sua contagem. Tem certeza que deseja AUTORIZAR o ajuste de estoque?')) {
                adjustStockMutation.mutate()
              }
            }}
            disabled={adjustStockMutation.isPending}
          >
            <ShieldAlert className="mr-2 h-5 w-5" /> Autorizar Ajuste de Estoque
          </Button>
        </div>
      )}
      
      {isCompleted && !isManager && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 md:sticky md:bottom-0 md:bg-transparent md:border-none md:p-0 md:pt-4 space-y-2">
            <div className="glass-card p-4 text-center border-amber-500/30 text-amber-500 text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Aguardando Gestor autorizar o ajuste.
            </div>
            <Button 
              variant="outline"
              className="w-full h-12 text-lg border-amber-500/50 text-amber-500 hover:bg-amber-500/10" 
              onClick={() => {
                if (window.confirm('Deseja reabrir este inventário para continuar contando?')) {
                  updateStatusMutation.mutate('in_progress')
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              Reabrir p/ Contagem
            </Button>
         </div>
      )}
    </div>
  )
}
