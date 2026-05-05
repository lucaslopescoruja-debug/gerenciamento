import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import type { OperationItem } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ScanLine, CheckCircle2, AlertTriangle, Camera, Search, Check, FileSignature, Zap, Truck, Plus, Trash2, Pencil } from 'lucide-react'

export default function Conference() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scanRef = useRef<HTMLInputElement>(null)
  
  const [scanInput, setScanInput] = useState('')
  const [activeTab, setActiveTab] = useState('scan')
  const [lastScanned, setLastScanned] = useState<OperationItem | null>(null)
  
  // Return state: maps product_code to quantity returned
  const [returnedItems, setReturnedItems] = useState<Record<string, number>>({})
  const [returnScanInput, setReturnScanInput] = useState('')
  const [lastReturned, setLastReturned] = useState<{ code: string, desc: string, qty: number } | null>(null)

  const { data: op, isLoading: isOpLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => operationsApi.getOperation(id!),
    enabled: !!id,
  })

  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['operation_items', id],
    queryFn: () => operationsApi.getOperationItems(id!),
    enabled: !!id,
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, qty, expected, status }: { itemId: string, qty: number, expected?: number, status: OperationItem['status'] }) => {
      if (expected !== undefined) {
        const [res] = await Promise.all([
          operationsApi.updateItemQuantity(itemId, qty, status), 
          operationsApi.updateItemExpectedQty(itemId, expected)
        ])
        return res
      }
      return operationsApi.updateItemQuantity(itemId, qty, status)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
  })

  const updateExpectedMutation = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string, qty: number }) => operationsApi.updateItemExpectedQty(itemId, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
  })

  const deleteItemMutation = useMutation({
    mutationFn: operationsApi.deleteOperationItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
  })

  const addItemMutation = useMutation({
    mutationFn: (item: Omit<OperationItem, 'id' | 'operation_id'>) => operationsApi.addOperationItem(id!, item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
  })

  const updateOpMutation = useMutation({
    mutationFn: ({ status }: { status: OperationItem['status'] | 'dispatched' | 'completed' }) => 
      operationsApi.updateOperationStatus(id!, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })

  // List editing states
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null)
  const [editQty, setEditQty] = useState(0)
  const [addSearchTerm, setAddSearchTerm] = useState('')

  useEffect(() => { if (activeTab === 'scan' || activeTab === 'return') scanRef.current?.focus() }, [activeTab])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    const code = scanInput.trim()
    setScanInput('')
    
    const matchedProduct = allProducts.find(p => p.code === code || p.external_code === code)
    const item = items.find(i => 
      i.product_code === code || 
      (matchedProduct && i.product_id === matchedProduct.id)
    )
    
    if (!item) { 
      if (!matchedProduct) {
        toast.error(`Produto não cadastrado no sistema: ${code}`)
        return
      }
      const ok = window.confirm(`${matchedProduct.description} não está na rota. Deseja adicionar?`)
      if (!ok) return
      
      const newItem = {
        product_id: matchedProduct.id,
        product_code: matchedProduct.code,
        description: matchedProduct.description,
        quantity_expected: 1,
        quantity_scanned: 1,
        status: 'ok' as const
      }
      addItemMutation.mutate(newItem)
      toast.success(`${matchedProduct.description} adicionado à rota!`)
      return 
    }
    
    const cur = item.quantity_scanned || 0
    let nextExpected = item.quantity_expected
    
    if (cur >= item.quantity_expected) { 
      const ok = window.confirm(`Atenção: A quantidade esperada para ${item.description} já foi atingida (${item.quantity_expected}). Deseja adicionar uma unidade extra à rota?`)
      if (!ok) return

      nextExpected = cur + 1
      toast.success(`${item.description}: Quantidade extra (+1) adicionada à rota!`)
    } else {
      const nq = cur + 1
      const ns = nq >= nextExpected ? 'ok' : 'pending'
      if (ns === 'ok') toast.success(`${item.description}: Conferido! ✓`)
      else toast.info(`${item.description}: +1 (${nq}/${nextExpected})`)
    }
    
    const nq = cur + 1
    const ns = nq >= nextExpected ? 'ok' : 'pending'
    
    const updated = { ...item, quantity_scanned: nq, quantity_expected: nextExpected, status: ns } as OperationItem
    
    queryClient.setQueryData(['operation_items', id], (old: OperationItem[]) => 
      old.map(i => i.id === item.id ? updated : i)
    )
    
    setLastScanned(updated)
    updateItemMutation.mutate({ itemId: item.id, qty: nq, expected: nextExpected, status: ns })
  }

  if (isOpLoading || isItemsLoading) return <div className="p-8 text-center text-muted-foreground">Carregando conferência...</div>

  if (!op) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
      <p>Operação não encontrada</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/cargas')}>Voltar</Button>
    </div>
  )

  const progress = () => {
    if (!items.length) return 0
    const t = items.reduce((a, i) => a + i.quantity_expected, 0)
    const s = items.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
    return Math.min(Math.round((s / t) * 100), 100)
  }
  
  const totalS = items.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
  const totalE = items.reduce((a, i) => a + i.quantity_expected, 0)

  const handleDispatch = () => {
    const missing = items.filter(i => i.quantity_scanned < i.quantity_expected)
    if (missing.length > 0) {
      const ok = window.confirm(`Faltam ${missing.length} item(ns). Despachar rota mesmo assim?`)
      if (!ok) return
    }
    updateOpMutation.mutate({ status: 'dispatched' })
    toast.success('Rota despachada com sucesso!')
    setActiveTab('return')
  }

  const handleReturnScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnScanInput.trim()) return
    const code = returnScanInput.trim()
    setReturnScanInput('')
    
    const matchedProduct = allProducts.find(p => p.code === code || p.external_code === code)
    const item = items.find(i => 
      i.product_code === code || i.product_id === code ||
      (matchedProduct && i.product_id === matchedProduct.id)
    )
    if (!item) { toast.error(`Produto não fazia parte da rota: ${code}`); return }
    
    const primaryCode = item.product_code
    
    setReturnedItems(prev => {
      const cur = prev[primaryCode] || 0
      const next = cur + 1
      setLastReturned({ code: primaryCode, desc: item.description, qty: next })
      return { ...prev, [primaryCode]: next }
    })
    toast.info(`${item.description}: Retornado +1`)
  }

  const handleFinishReturn = async () => {
    if (Object.keys(returnedItems).length > 0) {
      const ok = window.confirm(`Confirmar o retorno de ${Object.values(returnedItems).reduce((a,b)=>a+b,0)} unidades para o estoque?`)
      if (!ok) return
      
      try {
        for (const [code, qty] of Object.entries(returnedItems)) {
          await productsApi.incrementStockByCode(code, qty)
        }
        toast.info('Retorno salvo! Estoque atualizado.')
      } catch (err) {
        toast.error('Erro ao retornar estoque. Verifique os códigos.')
        return
      }
    }
    
    updateOpMutation.mutate({ status: 'completed' })
    toast.success('Rota finalizada!')
    navigate('/cargas')
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    if (editQty <= 0) {
      handleDeleteItem(editingItem.id)
      return
    }
    updateExpectedMutation.mutate({ itemId: editingItem.id, qty: editQty })
    setEditingItem(null)
    toast.success('Quantidade atualizada!')
  }

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Remover este item da rota?')) {
      deleteItemMutation.mutate(itemId)
      setEditingItem(null)
      toast.info('Item removido')
    }
  }

  const handleManualAdd = (productCodeOrName: string) => {
    const term = productCodeOrName.toLowerCase()
    const product = allProducts.find(p => p.code.toLowerCase() === term || p.external_code?.toLowerCase() === term || p.description.toLowerCase().includes(term))
    if (!product) { toast.error('Produto não encontrado'); return }
    
    const exists = items.find(i => i.product_id === product.id)
    if (exists) {
      updateExpectedMutation.mutate({ itemId: exists.id, qty: exists.quantity_expected + 1 })
      toast.success('Quantidade do item aumentada em 1')
    } else {
      addItemMutation.mutate({
        product_id: product.id,
        product_code: product.code,
        description: product.description,
        quantity_expected: 1,
        quantity_scanned: 0,
        status: 'pending'
      })
      toast.success('Produto adicionado à rota')
    }
    setAddSearchTerm('')
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground truncate">{op.load_number}</h1>
            <span className="text-xs text-muted-foreground">{op.status === 'dispatched' ? 'Em Rota' : op.status === 'completed' ? 'Finalizada' : 'Em Separação'}</span>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{totalS}/{totalE}</span>
                <span className="font-bold text-primary">{progress()}%</span>
              </div>
            </div>
            <Progress value={progress()} />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList>
          {op.status !== 'dispatched' && op.status !== 'completed' && <TabsTrigger value="scan"><ScanLine className="h-4 w-4 mr-1.5" />Carregamento</TabsTrigger>}
          {(op.status === 'dispatched' || activeTab === 'return') && <TabsTrigger value="return"><ArrowLeft className="h-4 w-4 mr-1.5" />Retorno</TabsTrigger>}
          <TabsTrigger value="list"><CheckCircle2 className="h-4 w-4 mr-1.5" />Lista</TabsTrigger>
        </TabsList>

        {op.status !== 'dispatched' && op.status !== 'completed' && (
        <TabsContent value="scan" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <form onSubmit={handleScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-primary/50 scan-pulse" />
                  <Input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Bipar código..." className="pl-11 h-12 text-lg font-mono" autoFocus />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12" disabled={updateItemMutation.isPending}><Search className="h-5 w-5" /></Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">Use câmera ou leitor bluetooth</p>
            </CardContent>
          </Card>

          {lastScanned ? (
            <div className={`glass-card p-4 flex items-center gap-4 slide-up ${lastScanned.status === 'ok' ? 'border-emerald-500/30' : ''}`}>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${lastScanned.status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/15 text-primary'}`}>
                {lastScanned.status === 'ok' ? <Check className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{lastScanned.description}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground font-mono">{lastScanned.product_code}</span>
                  <span className="font-mono font-bold text-lg">{lastScanned.quantity_scanned}/{lastScanned.quantity_expected}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 glass-card min-h-[200px]">
              <Camera className="h-14 w-14 mb-3 opacity-30" />
              <p className="text-sm">Aguardando leitura...</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <Button className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" onClick={handleDispatch} disabled={updateOpMutation.isPending}>
              <Truck className="mr-2 h-5 w-5" /> Despachar Rota
            </Button>
          </div>
        </TabsContent>
        )}

        {(op.status === 'dispatched' || activeTab === 'return') && (
        <TabsContent value="return" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <form onSubmit={handleReturnScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-amber-500/50 scan-pulse" />
                  <Input ref={scanRef} value={returnScanInput} onChange={e => setReturnScanInput(e.target.value)} placeholder="Bipar mercadoria que retornou..." className="pl-11 h-12 text-lg font-mono border-amber-500/30 focus-visible:ring-amber-500" autoFocus />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12 bg-amber-600 hover:bg-amber-700 text-white"><Search className="h-5 w-5" /></Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">Bipe os produtos que não foram entregues</p>
            </CardContent>
          </Card>

          {lastReturned ? (
            <div className="glass-card p-4 flex items-center gap-4 slide-up border-amber-500/30">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-500">
                <ArrowLeft className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{lastReturned.desc}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground font-mono">{lastReturned.code}</span>
                  <span className="font-mono font-bold text-lg text-amber-500">Voltou: {lastReturned.qty}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 glass-card min-h-[200px]">
              <Truck className="h-14 w-14 mb-3 opacity-30" />
              <p className="text-sm">Aguardando devoluções...</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <Button className="w-full h-12 text-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-warning text-white" onClick={handleFinishReturn} disabled={updateOpMutation.isPending}>
              <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar Rota
            </Button>
          </div>
        </TabsContent>
        )}

        <TabsContent value="list" className="flex-1 mt-4">
          <div className="space-y-4 pb-20">
            {op.status !== 'dispatched' && op.status !== 'completed' && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={addSearchTerm} 
                    onChange={e => setAddSearchTerm(e.target.value)} 
                    placeholder="Adicionar produto (código ou nome)..." 
                    className="pl-9"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleManualAdd(addSearchTerm) } }}
                  />
                </div>
                <Button onClick={() => handleManualAdd(addSearchTerm)}><Plus className="h-4 w-4" /></Button>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item, i) => {
                const done = item.quantity_scanned >= item.quantity_expected
                const isEditing = editingItem?.id === item.id
                
                if (isEditing) {
                  return (
                    <div key={item.id} className="glass-card p-3 flex flex-col gap-3 border-primary/30">
                      <p className="font-medium text-sm">{item.description}</p>
                      <div className="flex items-center gap-3">
                        <Label className="text-muted-foreground whitespace-nowrap">Qtd a Levar:</Label>
                        <Input type="number" value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-24 text-center font-bold" autoFocus />
                        <div className="flex-1"></div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                        <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit}>Salvar</Button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={item.id} className={`glass-card p-3 flex items-center justify-between slide-up ${done ? 'border-emerald-500/20' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate ${done ? 'text-emerald-300' : 'text-foreground'}`}>{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-lg font-bold font-mono ${done ? 'text-emerald-400' : 'text-foreground'}`}>{item.quantity_scanned || 0}</span>
                        <span className="text-muted-foreground text-sm">/{item.quantity_expected}</span>
                      </div>
                      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                      
                      {op.status !== 'dispatched' && op.status !== 'completed' && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditQty(item.quantity_expected) }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
