import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { deliveriesApi } from '@/api/deliveries'
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
import { ArrowLeft, ScanLine, CheckCircle2, AlertTriangle, Camera, Search, Check, FileSignature, Zap, Truck, Plus, Trash2, Pencil, Download, PackageCheck, Undo2, PenTool, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import * as XLSX from 'xlsx'
import { BarcodeCameraScanner } from '@/components/BarcodeCameraScanner'
import { ShortageResolverModal } from '@/components/ShortageResolverModal'
import type { Shortage } from '@/components/ShortageResolverModal'

export default function Conference() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scanRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  
  const [searchParams] = useSearchParams()
  const isRetorno = searchParams.get('retorno') === 'true'

  const [scanInput, setScanInput] = useState('')
  const [manualQty, setManualQty] = useState<number | ''>(1)
  const [activeTab, setActiveTab] = useState(isRetorno ? 'resumo' : 'scan')
  const [lastScanned, setLastScanned] = useState<OperationItem | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isLoadedListOpen, setIsLoadedListOpen] = useState(!isRetorno)
  const [isReturnListOpen, setIsReturnListOpen] = useState(true)
  
  const [isShortageResolverOpen, setIsShortageResolverOpen] = useState(false)
  const [pendingShortages, setPendingShortages] = useState<Shortage[]>([])
  
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

  // Fetch Delivery Route if it's a LOAD operation
  const { data: route } = useQuery({
    queryKey: ['delivery_route_by_op', id],
    queryFn: () => deliveriesApi.getDeliveryRouteByOperationId(id!),
    enabled: !!id && op?.type === 'LOAD',
  })

  // Fetch Delivery Clients if route exists
  const { data: clients = [] } = useQuery({
    queryKey: ['delivery_clients', route?.id],
    queryFn: () => deliveriesApi.getDeliveryClients(route!.id),
    enabled: !!route?.id,
  })

  const pendingReturnsCount = useMemo(() => {
    let count = 0
    
    // 1. O que foi carregado no caminhão
    const loadedMap = new Map<string, number>()
    items.forEach((item: any) => {
      if (item.quantity_scanned > 0 && !item.description.startsWith('🔄')) {
        const code = item.product_code
        loadedMap.set(code, (loadedMap.get(code) || 0) + item.quantity_scanned)
      }
    })

    // 2. O que foi resolvido (entregue ou já retornado)
    const resolvedMap = new Map<string, number>()
    clients.forEach((c: any) => {
      if (c.status !== 'returned') {
        c.delivery_items?.forEach((item: any) => {
          const resolved = item.returned_to_stock ? item.quantity_expected : (item.quantity_scanned || 0)
          resolvedMap.set(item.product_code, (resolvedMap.get(item.product_code) || 0) + resolved)
        })
      }
    })

    // 3. Calculando o retorno esperado
    for (const [code, loaded] of loadedMap.entries()) {
      const resolved = resolvedMap.get(code) || 0
      const expectedReturn = Math.max(0, loaded - resolved)
      if (expectedReturn > 0) {
        count += expectedReturn
      }
    }
    
    return count
  }, [items, clients])

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
    mutationFn: ({ status }: { status: 'pending' | 'in_progress' | 'dispatched' | 'completed' | 'cancelled' }) => 
      operationsApi.updateOperationStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
    }
  })

  const reopenMutation = useMutation({
    mutationFn: async () => {
      // 1. Add stock back for all scanned items
      for (const item of items) {
        if (item.quantity_scanned > 0) {
          await productsApi.incrementStockByCode(item.product_code, item.quantity_scanned)
        }
      }
      
      // 2. Delete shortage alerts for this operation
      await supabase.from('operation_alerts').delete().eq('operation_id', id!)
      
      // 3. Update status back to 'in_progress'
      return operationsApi.updateOperationStatus(id!, 'in_progress')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Carga reaberta com sucesso! Estoque restaurado.')
      setActiveTab('scan')
    },
    onError: (e: any) => {
      toast.error(`Erro ao reabrir carga: ${e.message}`)
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
      if (route?.id) {
        navigate(`/entregas/${route.id}`)
      } else {
        navigate('/entregas/nova')
      }
    },
    onError: (e: any) => {
      toast.error(`Erro ao despachar rota: ${e.message}`)
    }
  })

  const finalizeReceiptMutation = useMutation({
    mutationFn: async () => {
      const receiptAlerts = []
      for (const item of items) {
        if (item.quantity_scanned !== item.quantity_expected) {
          const isMissing = item.quantity_scanned < item.quantity_expected
          receiptAlerts.push({
            operation_id: id!,
            product_id: item.product_id,
            product_code: item.product_code,
            description: item.description,
            quantity_expected: item.quantity_expected,
            quantity_scanned: item.quantity_scanned,
            quantity_missing: isMissing ? item.quantity_expected - item.quantity_scanned : 0
          })
        }
      }

      if (receiptAlerts.length > 0) {
        await operationsApi.createOperationAlerts(receiptAlerts)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const userName = session.user.user_metadata?.name || 'Sistema'
          await supabase.from('system_notes').insert([{
            author_id: session.user.id,
            author_name: userName,
            content: `Divergência no Recebimento ${op?.load_number}: ${receiptAlerts.length} item(s) divergente(s).`,
          }])
        }
      }

      return operationsApi.finalizeReceiptAndUpdateStock(id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Recebimento finalizado e estoque atualizado!')
      navigate('/recebimentos')
    },
    onError: (e: any) => toast.error(`Erro ao finalizar recebimento: ${e.message}`)
  })

  const finalizeReturnMutation = useMutation({
    mutationFn: async () => {
      const returnAlerts = []
      for (const item of items) {
        if (item.quantity_scanned !== item.quantity_expected) {
          const isMissing = item.quantity_scanned < item.quantity_expected
          returnAlerts.push({
            operation_id: id!,
            product_id: item.product_id,
            product_code: item.product_code,
            description: item.description,
            quantity_expected: item.quantity_expected,
            quantity_scanned: item.quantity_scanned,
            quantity_missing: isMissing ? item.quantity_expected - item.quantity_scanned : 0
          })
        }
      }

      if (returnAlerts.length > 0) {
        await operationsApi.createOperationAlerts(returnAlerts)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const userName = session.user.user_metadata?.name || 'Sistema'
          await supabase.from('system_notes').insert([{
            author_id: session.user.id,
            author_name: userName,
            content: `Divergência na Carga de Retorno ${op?.load_number}: ${returnAlerts.length} item(s) com diferença.`,
          }])
        }
      }

      return operationsApi.finalizeReceiptAndUpdateStock(id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Retorno finalizado e estoque atualizado!')
      navigate('/recebimentos')
    },
    onError: (e: any) => toast.error(`Erro ao finalizar retorno: ${e.message}`)
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

  useEffect(() => {
    if (op && op.type === 'LOAD' && (op.status === 'dispatched' || op.status === 'completed') && activeTab === 'scan') {
      setActiveTab('return')
    }
  }, [op, activeTab])

  // Helper to strip non-alphanumeric characters and uppercase for comparison
  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

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

  const processConfCode = (raw: string) => {
    let parsedCode = raw.trim()
    let qtyToAdd = 1

    if (parsedCode.includes('*')) {
      const parts = parsedCode.split('*')
      if (parts.length === 2 && !isNaN(Number(parts[0])) && Number(parts[0]) > 0) {
        qtyToAdd = parseInt(parts[0], 10)
        parsedCode = parts[1]
      }
    }

    const code = normalizeCode(parsedCode)
    const matchedProduct = allProducts.find(p => normalizeCode(p.code) === code || (p.external_code && normalizeCode(p.external_code) === code))
    const item = items.find(i =>
      normalizeCode(i.product_code) === code ||
      (matchedProduct && i.product_id === matchedProduct.id)
    )
    
    if (!item) { 
      if (!matchedProduct) {
        playBeep('error')
        toast.error(`Produto não cadastrado no sistema: ${code}`)
        return
      }
      if (op?.type !== 'RECEIPT') {
        if (!isManager) {
          playBeep('error')
          window.alert(`ACESSO NEGADO: O produto ${matchedProduct.description} não está na rota. Procure um Gestor.`)
          return
        }
        playBeep('error')
        const ok = window.confirm(`${matchedProduct.description} não está na rota. Deseja adicionar?`)
        if (!ok) return
      }
      
      const isReceipt = op?.type === 'RECEIPT'
      const newItem = {
        product_id: matchedProduct.id,
        product_code: matchedProduct.code,
        description: matchedProduct.description,
        quantity_expected: isReceipt ? 0 : qtyToAdd,
        quantity_scanned: qtyToAdd,
        status: (isReceipt ? 'divergent' : 'ok') as 'divergent' | 'ok'
      }
      addItemMutation.mutate(newItem)
      playBeep('error')
      if (isReceipt) {
        toast.warning(`${matchedProduct.description} (${qtyToAdd}x) não estava na nota. Marcado como Excedente!`)
      } else {
        toast.success(`${matchedProduct.description} (${qtyToAdd}x) adicionado à rota!`)
      }
      if (op && op.status === 'pending') {
        updateOpMutation.mutate({ status: 'in_progress' })
      }
      return 
    }
    
    const cur = item.quantity_scanned || 0
    let nextExpected = item.quantity_expected
    const nq = cur + qtyToAdd
    
    if (nq > item.quantity_expected) { 
      if (op?.type !== 'RECEIPT') {
        if (!isManager) {
          playBeep('error')
          window.alert(`LIMITE ATINGIDO: A quantidade de ${item.description} já foi alcançada. Procure um Gestor.`)
          return
        }
        playBeep('error')
        const ok = window.confirm(`Atenção: A quantidade escaneada (${nq}) ultrapassa o esperado (${item.quantity_expected}) para ${item.description}. Deseja adicionar o extra à rota?`)
        if (!ok) return
        nextExpected = nq
        playBeep('error')
        toast.success(`${item.description}: Quantidade extra adicionada à rota!`)
      } else {
        playBeep('error')
        toast.warning(`${item.description}: Quantidade extra bipada (${nq}/${item.quantity_expected}). Marcado como Excedente!`)
      }
    } else {
      const ns = nq >= nextExpected ? 'ok' : 'pending'
      playBeep('success')
      if (ns === 'ok') toast.success(`${item.description}: Conferido! ✓`)
      else toast.info(`${item.description}: +${qtyToAdd} (${nq}/${nextExpected})`)
    }
    
    const ns = (op?.type === 'RECEIPT' && nq > nextExpected) ? 'divergent' : (nq >= nextExpected ? 'ok' : 'pending')
    
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
    if (op && op.status === 'pending') {
      updateOpMutation.mutate({ status: 'in_progress' })
    }
  }

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    const inputStr = manualQty && manualQty > 1 ? `${manualQty}*${scanInput.trim()}` : scanInput.trim()
    processConfCode(inputStr)
    setScanInput('')    
    setManualQty(1)
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

  const handleToggleCheckItem = (item: OperationItem) => {
    const done = item.quantity_scanned >= item.quantity_expected
    const actionText = done ? 'desmarcar' : 'marcar como conferido'
    if (!window.confirm(`Deseja realmente ${actionText} o item "${item.description}"?`)) {
      return
    }

    const newQty = done ? 0 : item.quantity_expected
    const ns = newQty >= item.quantity_expected ? 'ok' : 'pending'
    
    const matchedProduct = allProducts.find(p => p.id === item.product_id || normalizeCode(p.code) === normalizeCode(item.product_code))
    const systemStock = item.system_stock_at_load !== undefined && item.system_stock_at_load !== null 
      ? item.system_stock_at_load 
      : (matchedProduct ? matchedProduct.stock : 0)
    const isStockAlert = op?.type === 'LOAD' && (systemStock <= 0 || systemStock < item.quantity_expected)
    const isDivergent = isStockAlert && ((systemStock <= 0 && newQty > 0) || (systemStock > 0 && newQty > systemStock))
    
    const extraUpdates = isStockAlert ? {
      physical_verification: (newQty > 0 ? 'found' : 'pending') as 'pending' | 'found' | 'really_zero',
      physical_divergence_found: isDivergent
    } : {}

    const updated = { 
      ...item, 
      quantity_scanned: newQty, 
      status: ns,
      ...extraUpdates
    } as OperationItem
    
    queryClient.setQueryData(['operation_items', id], (old: OperationItem[]) => 
      old.map(i => i.id === item.id ? updated : i)
    )

    updateItemMutation.mutate({ 
      itemId: item.id, 
      qty: newQty, 
      status: ns,
      extraUpdates: isStockAlert ? extraUpdates : undefined
    })
    if (op && op.status === 'pending') {
      updateOpMutation.mutate({ status: 'in_progress' })
    }
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
      if (op?.type === 'LOAD' && isManager) {
        const shortages = missing.map(i => ({
          product_id: i.product_id || '',
          product_code: i.product_code || '',
          description: i.description || '',
          quantity_expected: i.quantity_expected,
          quantity_scanned: i.quantity_scanned,
          quantity_missing: i.quantity_expected - i.quantity_scanned
        }))
        setPendingShortages(shortages)
        setIsShortageResolverOpen(true)
        return
      } else {
        const ok = window.confirm(`Faltam ${missing.length} item(ns). Despachar rota mesmo assim?`)
        if (!ok) return
      }
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
        'Status': i.quantity_scanned > i.quantity_expected ? 'Excedente' : (i.quantity_scanned < i.quantity_expected ? 'Pendente' : 'OK'),
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
    if (!item) { playBeep('error'); toast.error(`Produto não fazia parte da rota: ${code}`); return }
    
    const primaryCode = item.product_code
    const cur = returnedItems[primaryCode] || 0
    
    if (cur >= item.quantity_scanned) {
      playBeep('error')
      window.alert(`LIMITE ATINGIDO: Não é possível retornar mais de ${item.quantity_scanned} unidades de ${item.description}, pois esta foi a quantidade enviada na rota.`)
      return
    }
    
    setReturnedItems(prev => {
      const next = cur + 1
      setLastReturned({ code: primaryCode, desc: item.description, qty: next })
      return { ...prev, [primaryCode]: next }
    })
    playBeep('success')
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
    if (window.confirm('Remover este item da rota?. Esta ação não pode ser desfeita.')) {
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
            <div className="flex gap-2 shrink-0">
              {(!op.type || op.type === 'LOAD') && (op.status === 'dispatched' || op.status === 'completed') && (
                <Button 
                  variant="outline"
                  className="gap-2 border-amber-600 text-amber-600 hover:bg-amber-50 h-10 px-3"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja reabrir esta conferência? O estoque será devolvido e a operação voltará para andamento.')) {
                      reopenMutation.mutate()
                    }
                  }}
                  disabled={reopenMutation.isPending}
                >
                  <Undo2 className="h-4 w-4" /> Reabrir
                </Button>
              )}
              <Button 
                variant="outline"
                className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 h-10 px-3"
                onClick={handleExportExcel}
                disabled={items.length === 0}
              >
                <Download className="h-4 w-4" /> Romaneio (Excel)
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 w-10" 
                onClick={handleDeleteOp} 
                disabled={deleteOpMutation.isPending}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
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
          {op.type !== 'LOAD' || (op.status !== 'dispatched' && op.status !== 'completed') ? (
             <TabsTrigger value="scan" className="flex-1"><ScanLine className="h-4 w-4 mr-1.5" />Conferência e Lista</TabsTrigger>
          ) : (
             <TabsTrigger value="return" className="flex-1"><ArrowLeft className="h-4 w-4 mr-1.5" />Retorno e Lista</TabsTrigger>
          )}
          {op.type === 'LOAD' && (
             <TabsTrigger value="divergences" className="flex-1 text-amber-600 dark:text-amber-600 dark:text-amber-400 font-medium">
               <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-600 dark:text-amber-400" />
               Divergências ({items.filter(i => i.physical_divergence_found).length})
             </TabsTrigger>
          )}
        </TabsList>

        {(op.type !== 'LOAD' || (op.status !== 'dispatched' && op.status !== 'completed')) && (
        <TabsContent value="scan" className="flex-1 flex flex-col gap-4 mt-4">
          {op.status !== 'completed' && op.status !== 'dispatched' && (
          <Card className="border-primary/20 sticky top-[53px] md:top-[64px] z-20 bg-card/95 backdrop-blur-md shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleScan} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="w-20 shrink-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">Qtd</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={manualQty} 
                      onChange={e => setManualQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-12 text-lg text-center font-bold"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <Label className="text-xs text-muted-foreground mb-1 block opacity-0">Código</Label>
                    <Input 
                      ref={scanRef} 
                      value={scanInput} 
                      onChange={e => setScanInput(e.target.value)} 
                      placeholder="Cod. de Barras" 
                      className="h-12 text-lg font-mono pr-12" 
                      autoFocus 
                    />
                    <Button type="button" onClick={() => setIsCameraOpen(true)} size="icon" variant="ghost" className="absolute right-1 top-7 h-10 w-10 text-muted-foreground hover:text-primary"><Camera className="h-5 w-5" /></Button>
                  </div>
                </div>
                <Button type="submit" className="hidden">Buscar</Button>
              </form>
            </CardContent>
          </Card>
          )}

          {lastScanned && (
            <div className={`glass-card p-4 flex items-center gap-4 slide-up shrink-0 ${lastScanned.status === 'ok' ? 'border-emerald-500/30' : ''}`}>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${lastScanned.status === 'ok' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/15 text-primary'}`}>
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
              const isExcedente = op?.type === 'RECEIPT' && item.quantity_scanned > item.quantity_expected
              const isFalta = op?.type === 'RECEIPT' && item.status === 'divergent' && item.quantity_scanned < item.quantity_expected
              const isDivergent = item.status === 'divergent' || isExcedente
              const matchedProduct = allProducts.find(p => p.id === item.product_id || normalizeCode(p.code) === normalizeCode(item.product_code))
              const groupName = matchedProduct?.group_name

              const cardClass = isExcedente 
                ? 'border-yellow-500/40 bg-yellow-500/5' 
                : isFalta || item.status === 'divergent'
                ? 'border-red-500/40 bg-red-500/5' 
                : done 
                ? 'border-emerald-500/20' 
                : hasAlert 
                ? 'border-amber-500/30 bg-amber-500/5' 
                : ''

              const textClass = isExcedente
                ? 'text-yellow-600 dark:text-yellow-400'
                : isFalta || item.status === 'divergent'
                ? 'text-red-600 dark:text-red-400'
                : done
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-foreground'

              const badgeClass = isExcedente
                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-red-500/20 text-red-600'

              const badgeText = isExcedente ? 'Excedente' : isFalta ? 'Falta' : 'Divergente'

              return (
                <div key={item.id} className={`glass-card p-3 flex flex-col gap-2 slide-up transition-all ${cardClass}`} style={{ animationDelay: `${i * 10}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium truncate ${textClass}`}>{item.description}</p>
                        {isDivergent && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${badgeClass}`}>
                            {badgeText}
                          </span>
                        )}
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
                        <span className={`text-lg font-bold font-mono ${textClass}`}>{item.quantity_scanned || 0}</span>
                        <span className="text-muted-foreground text-sm">/{item.quantity_expected}</span>
                      </div>
                      {op.status !== 'dispatched' && op.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item)}
                          className="hover:scale-105 active:scale-95 transition-transform"
                          title={done ? "Desmarcar item" : "Marcar como conferido"}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500/50" />
                          )}
                        </button>
                      ) : (
                        done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )
                      )}
                      
                      {isManager && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditQty(item.quantity_expected) }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {hasAlert && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
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
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
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
            {(op.type === 'RECEIPT' || op.type === 'LOAD' || op.type === 'RETURN') && (
               <Button variant="outline" className="w-full text-amber-600 hover:text-amber-700 border-amber-500/30 hover:bg-amber-500/10" onClick={handleExportExcel}>
                 <Download className="mr-2 h-4 w-4" /> Baixar Relatório de Cortes (Excel)
               </Button>
            )}
            
            {op.status !== 'completed' && op.status !== 'dispatched' ? (
              op.type === 'RECEIPT' ? (
                <Button className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" onClick={() => {
                  if (window.confirm('Atenção: Isso vai injetar as quantidades lidas diretamente no estoque. Deseja finalizar?')) {
                    finalizeReceiptMutation.mutate()
                  }
                }} disabled={finalizeReceiptMutation.isPending}>
                  {finalizeReceiptMutation.isPending ? 'Finalizando...' : <><PackageCheck className="mr-2 h-5 w-5" /> Finalizar e Atualizar Estoque</>}
                </Button>
              ) : op.type === 'RETURN' ? (
                <Button className="w-full h-12 text-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-success" onClick={() => {
                  if (window.confirm('Atenção: Isso vai finalizar a conferência de retorno e retornar os itens bipados ao estoque. Deseja finalizar?')) {
                    finalizeReturnMutation.mutate()
                  }
                }} disabled={finalizeReturnMutation.isPending}>
                  {finalizeReturnMutation.isPending ? 'Finalizando...' : <><PackageCheck className="mr-2 h-5 w-5" /> Finalizar Retorno</>}
                </Button>
              ) : (
                <Button className="w-full h-12 text-lg glow-primary" onClick={handleDispatch} disabled={dispatchMutation.isPending}>
                  {dispatchMutation.isPending ? 'Despachando...' : <><Truck className="mr-2 h-5 w-5" /> Despachar e Concluir Conferência</>}
                </Button>
              )
            ) : (
              <div className="w-full h-12 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="mr-2 h-5 w-5" /> Operação Finalizada
              </div>
            )}
          </div>
        </TabsContent>
        )}

        {(op.status === 'dispatched' || activeTab === 'return') && (
        <TabsContent value="return" className="flex-1 flex flex-col gap-4 mt-4">
          <div className="glass-card p-6 border-amber-500/30 bg-amber-500/5 flex flex-col items-center text-center gap-4 mt-4">
            <div className="h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Undo2 className="h-8 w-8 text-amber-600 dark:text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg mb-1">Aguardando Retorno Físico</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pendingReturnsCount > 0 
                  ? `Esta rota possui ${pendingReturnsCount} volumes que precisam retornar ao estoque.` 
                  : "Nenhuma pendência de retorno para esta rota, ou a rota ainda não possui itens configurados."}
              </p>
            </div>
            
            <Button 
              className="w-full sm:w-auto h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => {
                if (route?.id) navigate(`/entregas/${route.id}/retorno`)
              }}
              disabled={!route?.id}
            >
              <PenTool className="mr-2 h-5 w-5" />
              Conferir Retornos da Rota
            </Button>
          </div>


          <div className="space-y-2 mt-6">
            <div 
              className="pt-2 pb-1 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsLoadedListOpen(!isLoadedListOpen)}
            >
              <h3 className="text-sm font-bold text-foreground">Lista de Carregamento</h3>
              <div className="text-muted-foreground">
                {isLoadedListOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
            {isLoadedListOpen && (
              <div className="space-y-2">
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
                      <p className={`font-medium truncate ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-lg font-bold font-mono ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>{item.quantity_scanned || 0}</span>
                        <span className="text-muted-foreground text-sm">/{item.quantity_expected}</span>
                      </div>
                      {op.status !== 'dispatched' && op.status !== 'completed' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item)}
                          className="hover:scale-105 active:scale-95 transition-transform"
                          title={done ? "Desmarcar item" : "Marcar como conferido"}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-emerald-500/50" />
                          )}
                        </button>
                      ) : (
                        done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )
                      )}
                      
                      {op.status !== 'dispatched' && op.status !== 'completed' && isManager && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditQty(item.quantity_expected) }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              </div>
            )}

            {returnItemsList.length > 0 && (
              <div className="space-y-2 mt-6">
                <div 
                  className="pt-2 pb-1 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsReturnListOpen(!isReturnListOpen)}
                >
                  <h3 className="text-sm font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Lista de Retorno
                  </h3>
                  <div className="text-muted-foreground">
                    {isReturnListOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
                {isReturnListOpen && (
                  <div className="space-y-2">
                    {returnItemsList.map((item, i) => (
                    <div key={item.id} className="glass-card p-3 flex items-center justify-between slide-up border-amber-500/20 bg-amber-500/5" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-amber-600 dark:text-amber-600 dark:text-amber-400">{item.description.replace('🔄 Devolução: ', '')}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400/70 font-mono">{item.product_code}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-600 dark:text-amber-400">+{item.quantity_scanned}</span>
                          <span className="text-amber-600 dark:text-amber-600 dark:text-amber-400/70 text-sm"> devolvidos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
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
          {/* Nova Seção: Cortes de Pedido (Faltas na Carga) */}
          {isManager && (op.status === 'dispatched' || op.status === 'completed') && items.filter(i => i.quantity_scanned < i.quantity_expected).length > 0 && (
            <Card className="border-red-500/30">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" /> Faltas (Cortes de Pedido)
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  O conferente despachou a carga com faltas. Como gestor, você precisa definir de quais clientes esses itens serão cortados.
                </p>
                <Button 
                  className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 text-white font-bold" 
                  onClick={() => {
                    const shortages = items.filter(i => i.quantity_scanned < i.quantity_expected).map(i => ({
                      product_id: i.product_id || '',
                      product_code: i.product_code || '',
                      description: i.description || '',
                      quantity_expected: i.quantity_expected,
                      quantity_scanned: i.quantity_scanned,
                      quantity_missing: i.quantity_expected - i.quantity_scanned
                    }))
                    setPendingShortages(shortages)
                    setIsShortageResolverOpen(true)
                  }}
                >
                  Resolver Cortes de Pedido ({items.filter(i => i.quantity_scanned < i.quantity_expected).length})
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2">
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${isResolved ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-600 dark:text-amber-400'}`}>
                            {isResolved ? 'Ajustado' : 'Pendente de Ajuste'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background/50 rounded-lg p-2.5 font-mono border border-border/50">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Estoque Inicial</span>
                            <span className="font-bold">{systemStock}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-600 dark:text-amber-600 dark:text-amber-400 block uppercase">Encontrado Físico</span>
                            <span className="font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400">{item.quantity_scanned}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Estoque Atual</span>
                            <span className="font-bold">{currentStock}</span>
                          </div>
                        </div>

                        {!isResolved && (
                          <div className="flex items-center justify-between gap-4 mt-1">
                            <div className="text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400 font-medium">
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

      {op && (
        <ShortageResolverModal
          isOpen={isShortageResolverOpen}
          onClose={() => setIsShortageResolverOpen(false)}
          onResolved={() => {
            setIsShortageResolverOpen(false)
            if (op.status !== 'dispatched' && op.status !== 'completed') {
              dispatchMutation.mutate()
            } else {
              queryClient.invalidateQueries({ queryKey: ['operation', id] })
            }
          }}
          shortages={pendingShortages}
          operationId={op.id}
        />
      )}
    </div>
  )
}
