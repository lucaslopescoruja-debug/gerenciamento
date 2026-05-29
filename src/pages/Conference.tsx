import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { supabase } from '@/lib/supabase'
import type { OperationItem } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ScanLine, CheckCircle2, AlertTriangle, Camera, Search, Check, FileSignature, Zap, Truck, Plus, Trash2, Pencil, Download, PackageCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import * as XLSX from 'xlsx'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'

export default function Conference() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scanRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  
  const [scanInput, setScanInput] = useState('')
  const [activeTab, setActiveTab] = useState('scan')
  const [lastScanned, setLastScanned] = useState<OperationItem | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
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
    mutationFn: async ({ itemId, qty, expected, status, extraUpdates }: { 
      itemId: string, 
      qty: number, 
      expected?: number, 
      status: OperationItem['status'],
      extraUpdates?: any
    }) => {
      if (expected !== undefined) {
        const [res] = await Promise.all([
          operationsApi.updateItemQuantity(itemId, qty, status, extraUpdates), 
          operationsApi.updateItemExpectedQty(itemId, expected)
        ])
        return res
      }
      return operationsApi.updateItemQuantity(itemId, qty, status, extraUpdates)
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
    mutationFn: (item: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>) => operationsApi.addOperationItem(id!, item),
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

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      // 1. Deduct stock for all scanned items & identify shortages
      const shortageAlerts = []
      for (const item of items) {
        if (item.quantity_scanned > 0) {
          await productsApi.incrementStockByCode(item.product_code, -item.quantity_scanned)
        }

        // Check if there's a shortage (exclude devoluções starting with 🔄)
        if (item.quantity_scanned < item.quantity_expected && !item.description.startsWith('🔄')) {
          shortageAlerts.push({
            operation_id: id!,
            product_id: item.product_id,
            product_code: item.product_code,
            description: item.description,
            quantity_expected: item.quantity_expected,
            quantity_scanned: item.quantity_scanned,
            quantity_missing: item.quantity_expected - item.quantity_scanned
          })
        }
      }

      // 2. Save alerts if any shortages exist
      if (shortageAlerts.length > 0) {
        await operationsApi.createOperationAlerts(shortageAlerts)
      }

      // 3. Update operation status
      return operationsApi.updateOperationStatus(id!, 'dispatched')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Rota despachada, estoque deduzido e alertas gerados!')
      navigate('/entregas/nova')
    },
    onError: (e: any) => {
      toast.error(`Erro ao despachar rota: ${e.message}`)
    }
  })

  const finalizeReceiptMutation = useMutation({
    mutationFn: () => operationsApi.finalizeReceiptAndUpdateStock(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Recebimento finalizado e estoque atualizado!')
      navigate('/recebimentos')
    },
    onError: (e: any) => toast.error(`Erro ao finalizar recebimento: ${e.message}`)
  })

  const deleteOpMutation = useMutation({
    mutationFn: () => operationsApi.deleteOperation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      toast.info('Rota excluída com sucesso.')
      navigate('/cargas')
    },
    onError: (e: any) => toast.error(`Erro ao excluir rota: ${e.message}`)
  })

  const verifyItemMutation = useMutation({
    mutationFn: async ({ 
      itemId, 
      verification, 
      scannedQty, 
      status 
    }: { 
      itemId: string, 
      verification: 'pending' | 'really_zero' | 'found', 
      scannedQty: number, 
      status: OperationItem['status'] 
    }) => {
      const item = items.find(i => i.id === itemId)
      const systemStock = item?.system_stock_at_load !== undefined && item?.system_stock_at_load !== null 
        ? item.system_stock_at_load 
        : 0
      
      const isDivergent = verification === 'found' && ((systemStock <= 0 && scannedQty > 0) || (systemStock > 0 && scannedQty > systemStock))
      
      return operationsApi.updateItemQuantity(itemId, scannedQty, status, {
        physical_verification: verification,
        physical_divergence_found: isDivergent
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
      toast.success('Confirmação física registrada!')
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar confirmação: ${e.message}`)
    }
  })


  // List editing states
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null)
  const [editQty, setEditQty] = useState(0)
  const [addSearchTerm, setAddSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  useEffect(() => {
    if (addSearchTerm.trim().length > 0) {
      const term = normalizeCode(addSearchTerm.trim());
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
  }, [addSearchTerm, allProducts]);

  useEffect(() => { if (activeTab === 'scan' || activeTab === 'return') scanRef.current?.focus() }, [activeTab])

  // Helper to strip non-alphanumeric characters and uppercase for comparison
  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const processConfCode = (raw: string) => {
    const code = normalizeCode(raw)
    const matchedProduct = allProducts.find(p => normalizeCode(p.code) === code || (p.external_code && normalizeCode(p.external_code) === code))
    const item = items.find(i =>
      normalizeCode(i.product_code) === code ||
      (matchedProduct && i.product_id === matchedProduct.id)
    )
    
    if (!item) { 
      if (!matchedProduct) {
        toast.error(`Produto não cadastrado no sistema: ${code}`)
        return
      }
      if (op?.type !== 'RECEIPT') {
        if (!isManager) {
          window.alert(`ACESSO NEGADO: O produto ${matchedProduct.description} não está na rota. Procure um Gestor.`)
          return
        }
        const ok = window.confirm(`${matchedProduct.description} não está na rota. Deseja adicionar?`)
        if (!ok) return
      }
      
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
      if (op?.type !== 'RECEIPT') {
        if (!isManager) {
          window.alert(`LIMITE ATINGIDO: A quantidade de ${item.description} já foi alcançada. Procure um Gestor.`)
          return
        }
        const ok = window.confirm(`Atenção: A quantidade esperada para ${item.description} já foi atingida (${item.quantity_expected}). Deseja adicionar uma unidade extra à rota?`)
        if (!ok) return
      }

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
    
    // Check stock alerts and physical divergence
    const systemStock = item.system_stock_at_load !== undefined && item.system_stock_at_load !== null 
      ? item.system_stock_at_load 
      : (matchedProduct ? matchedProduct.stock : 0)
    const isStockAlert = op?.type === 'LOAD' && (systemStock <= 0 || systemStock < nextExpected)
    const isDivergent = isStockAlert && ((systemStock <= 0 && nq > 0) || (systemStock > 0 && nq > systemStock))
    
    const extraUpdates = isStockAlert ? {
      physical_verification: 'found' as const,
      physical_divergence_found: isDivergent
    } : {}

    const updated = { 
      ...item, 
      quantity_scanned: nq, 
      quantity_expected: nextExpected, 
      status: ns,
      ...extraUpdates
    } as OperationItem
    
    queryClient.setQueryData(['operation_items', id], (old: OperationItem[]) => 
      old.map(i => i.id === item.id ? updated : i)
    )
    
    setLastScanned(updated)
    updateItemMutation.mutate({ 
      itemId: item.id, 
      qty: nq, 
      expected: nextExpected, 
      status: ns,
      extraUpdates: isStockAlert ? extraUpdates : undefined
    })
  }

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    processConfCode(scanInput.trim())
    setScanInput('')    
  }

  const getSystemStock = (item: OperationItem) => {
    if (item.system_stock_at_load !== undefined && item.system_stock_at_load !== null) {
      return item.system_stock_at_load
    }
    const prod = allProducts.find(p => p.id === item.product_id || normalizeCode(p.code) === normalizeCode(item.product_code))
    return prod ? prod.stock : 0
  }

  const hasStockAlert = (item: OperationItem) => {
    if (op?.type !== 'LOAD') return false
    const stock = getSystemStock(item)
    return stock <= 0 || stock < item.quantity_expected
  }

  if (isOpLoading || isItemsLoading) return <div className="p-8 text-center text-muted-foreground">Carregando conferência...</div>

  if (!op) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
      <p>Operação não encontrada</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/cargas')}>Voltar</Button>
    </div>
  )

  const regularItems = items
    .filter(i => !i.description.startsWith('🔄'))
    .sort((a, b) => {
      const prodA = allProducts.find(p => p.id === a.product_id || normalizeCode(p.code) === normalizeCode(a.product_code))
      const prodB = allProducts.find(p => p.id === b.product_id || normalizeCode(p.code) === normalizeCode(b.product_code))
      const groupA = prodA?.group_name || ''
      const groupB = prodB?.group_name || ''
      return groupA.localeCompare(groupB) || a.description.localeCompare(b.description)
    });
  const returnItemsList = items.filter(i => i.description.startsWith('🔄'));

  const progress = () => {
    if (!regularItems.length) return 0
    const t = regularItems.reduce((a, i) => a + i.quantity_expected, 0)
    const s = regularItems.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
    return Math.min(Math.round((s / t) * 100), 100)
  }
  
  const totalS = regularItems.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
  const totalE = regularItems.reduce((a, i) => a + i.quantity_expected, 0)

  const handleDispatch = () => {
    const missing = items.filter(i => i.quantity_scanned < i.quantity_expected)
    if (missing.length > 0) {
      const ok = window.confirm(`Faltam ${missing.length} item(ns). Despachar rota mesmo assim?`)
      if (!ok) return
    }
    dispatchMutation.mutate()
  }

  const handleExportExcel = () => {
    const isLoad = op?.type === 'LOAD'
    const data = items.map(i => {
      if (isLoad) {
        return {
          'Código': i.product_code,
          'Descrição': i.description,
          'Qtd Esperada (Pedido)': i.quantity_expected,
          'Qtd Carregada (Físico)': i.quantity_scanned,
          'Status': i.status === 'ok' ? 'OK' : (i.status === 'divergent' ? 'Divergente' : 'Pendente'),
          'Diferença (Corte)': i.quantity_scanned - i.quantity_expected
        }
      }
      return {
        'Código': i.product_code,
        'Descrição': i.description,
        'Qtd Esperada': i.quantity_expected,
        'Qtd Recebida': i.quantity_scanned,
        'Status': i.status === 'ok' ? 'OK' : (i.status === 'divergent' ? 'Divergente' : 'Pendente'),
        'Diferença': i.quantity_scanned - i.quantity_expected
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
    XLSX.writeFile(wb, `Relatorio_${isLoad ? 'Cortes_Carga' : 'Recebimento'}_${op?.load_number || id}.xlsx`)
  }

  const processReturnCode = (raw: string) => {
    const code = normalizeCode(raw)
    const matchedProduct = allProducts.find(p => normalizeCode(p.code) === code || (p.external_code && normalizeCode(p.external_code) === code))
    const item = items.find(i =>
      normalizeCode(i.product_code) === code ||
      i.product_id === code ||
      (matchedProduct && i.product_id === matchedProduct.id)
    )
    if (!item) { toast.error(`Produto não fazia parte da rota: ${code}`); return }
    
    const primaryCode = item.product_code
    const cur = returnedItems[primaryCode] || 0
    
    if (cur >= item.quantity_scanned) {
      window.alert(`LIMITE ATINGIDO: Não é possível retornar mais de ${item.quantity_scanned} unidades de ${item.description}, pois esta foi a quantidade enviada na rota.`)
      return
    }
    
    setReturnedItems(prev => {
      const next = cur + 1
      setLastReturned({ code: primaryCode, desc: item.description, qty: next })
      return { ...prev, [primaryCode]: next }
    })
    toast.info(`${item.description}: Retornado +1`)
  }

  const handleReturnScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnScanInput.trim()) return
    processReturnCode(returnScanInput.trim())
    setReturnScanInput('')
  }

  const handleFinishReturn = async () => {
    if (Object.keys(returnedItems).length > 0) {
      const ok = window.confirm(`Confirmar o retorno de ${Object.values(returnedItems).reduce((a,b)=>a+b,0)} unidades para o estoque?`)
      if (!ok) return
      
      try {
        for (const [code, qty] of Object.entries(returnedItems)) {
          await productsApi.incrementStockByCode(code, qty)
          const itemOrig = items.find(i => i.product_code === code)
          if (itemOrig) {
            await operationsApi.addOperationItem(id!, {
              product_id: itemOrig.product_id,
              product_code: itemOrig.product_code,
              description: `🔄 Devolução: ${itemOrig.description}`,
              quantity_expected: 0,
              quantity_scanned: qty,
              status: 'ok'
            })
          }
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

  const handleDeleteOp = () => {
    if (window.confirm('CUIDADO: Tem certeza que deseja apagar esta rota inteira? Esta ação não pode ser desfeita.')) {
      deleteOpMutation.mutate()
    }
  }

  const handleExactManualAdd = (productCodeOrName: string) => {
    const raw = productCodeOrName.trim()
    if (!raw) return
    const term = normalizeCode(raw)
    const product = allProducts.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    if (!product) { toast.error('Produto não encontrado com esse código exato'); return }
    
    addSelectedProduct(product);
  }

  const addSelectedProduct = (product: any) => {
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
      toast.success('Novo item adicionado à rota')
    }
    setAddSearchTerm('')
    setShowDropdown(false)
  }

  if (isOpLoading || isItemsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando conferência...</div>
  }

  if (!op) {
    return <div className="p-8 text-center text-muted-foreground">Operação não encontrada</div>
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(op.type === 'RECEIPT' ? '/recebimentos' : '/cargas')} className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{op.load_number}</h1>
            <span className="text-xs text-muted-foreground">{op.status === 'dispatched' ? 'Em Rota' : op.status === 'completed' ? 'Finalizada' : (op.type === 'RECEIPT' ? 'Em Conferência' : 'Em Separação')}</span>
          </div>
          {op.status === 'pending' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:text-primary/80 hover:bg-primary/10 shrink-0" 
              onClick={() => navigate(op.type === 'RECEIPT' ? `/recebimentos/editar/${id}` : `/editar-carga/${id}`)}
              title="Editar"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          )}
          {isManager && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0" 
              onClick={handleDeleteOp} 
              disabled={deleteOpMutation.isPending}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
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
          {op.status !== 'dispatched' && op.status !== 'completed' ? (
             <TabsTrigger value="scan" className="flex-1"><ScanLine className="h-4 w-4 mr-1.5" />Conferência e Lista</TabsTrigger>
          ) : (
             <TabsTrigger value="return" className="flex-1"><ArrowLeft className="h-4 w-4 mr-1.5" />Retorno e Lista</TabsTrigger>
          )}
          {op.type === 'LOAD' && (
             <TabsTrigger value="divergences" className="flex-1 text-amber-500 font-medium">
               <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-500" />
               Divergências ({items.filter(i => i.physical_divergence_found).length})
             </TabsTrigger>
          )}
        </TabsList>

        {op.status !== 'dispatched' && op.status !== 'completed' && (
        <TabsContent value="scan" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-primary/20 sticky top-[53px] md:top-[64px] z-20 bg-card/95 backdrop-blur-md shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-primary/50 scan-pulse" />
                  <Input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Bipar código..." className="pl-11 h-12 text-lg font-mono" autoFocus />
                </div>
                <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="outline" className="h-12 w-12 border-primary/30 text-primary hover:bg-primary/10" title="Usar câmera"><Camera className="h-5 w-5" /></Button>
                <Button type="submit" size="icon" className="h-12 w-12" disabled={updateItemMutation.isPending}><Search className="h-5 w-5" /></Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">Use câmera ou leitor bluetooth</p>
            </CardContent>
          </Card>

          {lastScanned && (
            <div className={`glass-card p-4 flex items-center gap-4 slide-up shrink-0 ${lastScanned.status === 'ok' ? 'border-emerald-500/30' : ''}`}>
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
          )}

          {isManager && (
            <div className="flex gap-2 shrink-0 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={addSearchTerm} 
                  onChange={e => setAddSearchTerm(e.target.value)} 
                  placeholder="Código exato ou busque por descrição..." 
                  className="pl-9 bg-background/50"
                  onKeyDown={e => { 
                    if (e.key === 'Enter') { 
                      e.preventDefault(); 
                      if (filteredProducts.length === 1 && normalizeCode(filteredProducts[0].code) === normalizeCode(addSearchTerm.trim())) {
                         addSelectedProduct(filteredProducts[0]);
                      } else {
                         handleExactManualAdd(addSearchTerm);
                      }
                    } 
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onFocus={() => { if (addSearchTerm.trim().length > 0) setShowDropdown(true) }}
                />
                
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => addSelectedProduct(p)}
                      >
                        <span className="text-sm font-medium">{p.description}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && addSearchTerm.trim().length > 0 && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
              <Button onClick={() => handleExactManualAdd(addSearchTerm)}><Plus className="h-4 w-4" /></Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pb-4 min-h-[200px]">
            {regularItems.map((item, i) => {
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

              const hasAlert = hasStockAlert(item)
              const matchedProduct = allProducts.find(p => p.id === item.product_id || normalizeCode(p.code) === normalizeCode(item.product_code))
              const groupName = matchedProduct?.group_name

              return (
                <div key={item.id} className={`glass-card p-3 flex flex-col gap-2 slide-up transition-all ${done ? 'border-emerald-500/20' : hasAlert ? 'border-amber-500/30 bg-amber-500/5' : ''}`} style={{ animationDelay: `${i * 10}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium truncate ${done ? 'text-emerald-300' : 'text-foreground'}`}>{item.description}</p>
                        {groupName && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                            {groupName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-lg font-bold font-mono ${done ? 'text-emerald-400' : 'text-foreground'}`}>{item.quantity_scanned || 0}</span>
                        <span className="text-muted-foreground text-sm">/{item.quantity_expected}</span>
                      </div>
                      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                      
                      {isManager && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditQty(item.quantity_expected) }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {hasAlert && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-start gap-1.5 text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Estoque no sistema menor que o previsto. Confirmar no físico durante a conferência. <span className="font-semibold">(Sistema: {getSystemStock(item)})</span></span>
                      </div>

                      {op.status !== 'dispatched' && op.status !== 'completed' && (
                        <div className="flex items-center gap-2 mt-1">
                          {item.physical_verification === 'really_zero' ? (
                            <div className="flex items-center justify-between w-full bg-red-500/10 border border-red-500/20 rounded p-1.5 px-2.5">
                              <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                                🛑 Confirmado: Zerado no Físico
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => verifyItemMutation.mutate({ itemId: item.id, verification: 'pending', scannedQty: 0, status: 'pending' })}
                                disabled={verifyItemMutation.isPending}
                              >
                                Desfazer
                              </Button>
                            </div>
                          ) : item.physical_verification === 'found' ? (
                            <div className="flex items-center justify-between w-full bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5 px-2.5">
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                🟢 Confirmado: Encontrado no Físico
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => verifyItemMutation.mutate({ itemId: item.id, verification: 'pending', scannedQty: 0, status: 'pending' })}
                                disabled={verifyItemMutation.isPending}
                              >
                                Desfazer
                              </Button>
                            </div>
                          ) : (
                            <div className="flex w-full">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full h-8 text-[11px] font-bold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={() => verifyItemMutation.mutate({ itemId: item.id, verification: 'really_zero', scannedQty: 0, status: 'ok' })}
                                disabled={verifyItemMutation.isPending}
                              >
                                Não Encontrado
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {item.physical_divergence_found && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 p-1.5 rounded border border-blue-500/20 w-fit font-semibold mt-1">
                      <Check className="h-3.5 w-3.5" /> Divergência física encontrada (confirmado no físico)
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-auto pt-2 shrink-0 pb-4 space-y-2">
            {(op.type === 'RECEIPT' || op.type === 'LOAD') && (
               <Button variant="outline" className="w-full text-amber-600 hover:text-amber-700 border-amber-500/30 hover:bg-amber-500/10" onClick={handleExportExcel}>
                 <Download className="mr-2 h-4 w-4" /> Baixar Relatório de Cortes (Excel)
               </Button>
            )}
            
            {op.type === 'RECEIPT' ? (
              <Button className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" onClick={() => {
                if (window.confirm('Atenção: Isso vai injetar as quantidades lidas diretamente no estoque. Deseja finalizar?')) {
                  finalizeReceiptMutation.mutate()
                }
              }} disabled={finalizeReceiptMutation.isPending}>
                {finalizeReceiptMutation.isPending ? 'Finalizando...' : <><PackageCheck className="mr-2 h-5 w-5" /> Finalizar e Atualizar Estoque</>}
              </Button>
            ) : (
              <Button className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" onClick={handleDispatch} disabled={dispatchMutation.isPending}>
                {dispatchMutation.isPending ? 'Despachando...' : <><Truck className="mr-2 h-5 w-5" /> Despachar Rota</>}
              </Button>
            )}
          </div>
        </TabsContent>
        )}

        {(op.status === 'dispatched' || activeTab === 'return') && (
        <TabsContent value="return" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-amber-500/20 sticky top-[53px] md:top-[64px] z-20 bg-card/95 backdrop-blur-md shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleReturnScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-amber-500/50 scan-pulse" />
                  <Input ref={scanRef} value={returnScanInput} onChange={e => setReturnScanInput(e.target.value)} placeholder="Bipar mercadoria que retornou..." className="pl-11 h-12 text-lg font-mono border-amber-500/30 focus-visible:ring-amber-500" autoFocus />
                </div>
                <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="outline" className="h-12 w-12 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" title="Usar câmera"><Camera className="h-5 w-5" /></Button>
                <Button type="submit" size="icon" className="h-12 w-12 bg-amber-600 hover:bg-amber-700 text-white"><Search className="h-5 w-5" /></Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">Bipe os produtos que não foram entregues</p>
            </CardContent>
          </Card>

          {lastReturned && (
            <div className="glass-card p-4 flex items-center gap-4 slide-up border-amber-500/30 shrink-0">
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
          )}


            {Object.keys(returnedItems).length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-2 pb-4 min-h-[200px]">
              <div className="pt-2 pb-1">
                <h3 className="text-sm font-bold text-amber-500">Itens Bipados Agora ({Object.values(returnedItems).reduce((a,b)=>a+b,0)} un)</h3>
              </div>
              {Object.entries(returnedItems).map(([code, qty], i) => {
                const itemDesc = items.find(it => it.product_code === code)?.description || allProducts.find(p => p.code === code)?.description || 'Produto'
                return (
                  <div key={code} className="glass-card p-3 flex items-center justify-between slide-up border-amber-500/20 bg-amber-500/5" style={{ animationDelay: `${i * 10}ms` }}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-amber-500">{itemDesc}</p>
                      <p className="text-xs text-amber-500/70 font-mono">{code}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-amber-500">+{qty}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/40 glass-card py-6">
              <Truck className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Aguardando devoluções...</p>
            </div>
          )}

          <div className="space-y-2 mt-6">
            <div className="pt-2 pb-1">
              <h3 className="text-sm font-bold text-foreground">Lista de Produtos da Rota</h3>
            </div>
              {regularItems.map((item, i) => {
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
                      
                      {op.status !== 'dispatched' && op.status !== 'completed' && isManager && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditQty(item.quantity_expected) }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}

              {returnItemsList.length > 0 && (
                <>
                  <div className="pt-6 pb-2">
                    <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" /> Devoluções Anteriores
                    </h3>
                  </div>
                  {returnItemsList.map((item, i) => (
                    <div key={item.id} className="glass-card p-3 flex items-center justify-between slide-up border-amber-500/20 bg-amber-500/5" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-amber-500">{item.description.replace('🔄 Devolução: ', '')}</p>
                        <p className="text-xs text-amber-500/70 font-mono">{item.product_code}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-bold font-mono text-amber-500">+{item.quantity_scanned}</span>
                          <span className="text-amber-500/70 text-sm"> devolvidos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>


            <div className="mt-auto pt-4">
              <Button className="w-full h-12 text-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-warning text-white" onClick={handleFinishReturn} disabled={updateOpMutation.isPending}>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar Rota
              </Button>
            </div>
        </TabsContent>
        )}

        {op.type === 'LOAD' && (
        <TabsContent value="divergences" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5" /> Relatório de Divergências de Estoque
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Produtos que apresentaram falta de estoque no sistema, mas foram localizados e carregados fisicamente.
              </p>

              {items.filter(i => i.physical_divergence_found).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                  Nenhuma divergência de estoque física registrada nesta carga.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.filter(i => i.physical_divergence_found).map(item => {
                    const systemStock = item.system_stock_at_load ?? 0
                    const actualProduct = allProducts.find(p => p.id === item.product_id || normalizeCode(p.code) === normalizeCode(item.product_code))
                    const currentStock = actualProduct ? actualProduct.stock : 0
                    const isResolved = item.divergence_resolved
                    
                    return (
                      <div key={item.id} className={`glass-card p-4 flex flex-col gap-3 border-l-4 ${isResolved ? 'border-l-emerald-500 border-emerald-500/20' : 'border-l-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-foreground text-sm leading-tight">{item.description}</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-1">Cód: {item.product_code}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${isResolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                            {isResolved ? 'Ajustado' : 'Pendente de Ajuste'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background/50 rounded-lg p-2.5 font-mono border border-border/50">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Estoque Inicial</span>
                            <span className="font-bold">{systemStock}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-500 block uppercase">Encontrado Físico</span>
                            <span className="font-bold text-amber-500">{item.quantity_scanned}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Estoque Atual</span>
                            <span className="font-bold">{currentStock}</span>
                          </div>
                        </div>

                        {!isResolved && (
                          <div className="flex items-center justify-between gap-4 mt-1">
                            <div className="text-xs text-amber-500 font-medium">
                              Aguardando liberação de ajuste de estoque em "Liberações" por um Administrador/Gestor.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>

      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          if (activeTab === 'scan') {
            processConfCode(code);
          } else if (activeTab === 'return') {
            processReturnCode(code);
          }
        }}
      />
    </div>
  )
}
