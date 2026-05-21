import { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, Trash2, ClipboardList, Truck, User, Search, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface NewItem {
  tempId: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
}

export default function CreateLoad() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const [loadNumber, setLoadNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [helperName, setHelperName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<NewItem[]>([])
  const [codeSearch, setCodeSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  
  // Lists for autocomplete
  const [savedDrivers, setSavedDrivers] = useState<string[]>([])
  const [savedVehicles, setSavedVehicles] = useState<string[]>([])
  const [savedHelpers, setSavedHelpers] = useState<string[]>([])

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('coletor_drivers') || '[]')
      const v = JSON.parse(localStorage.getItem('coletor_vehicles') || '[]')
      const h = JSON.parse(localStorage.getItem('coletor_helpers') || '[]')
      if (Array.isArray(d)) setSavedDrivers(d)
      if (Array.isArray(v)) setSavedVehicles(v)
      if (Array.isArray(h)) setSavedHelpers(h)
    } catch(e) {}
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const { data: existingOp } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => operationsApi.getOperation(id!),
    enabled: !!id,
  })

  const { data: existingItems = [] } = useQuery({
    queryKey: ['operation_items', id],
    queryFn: () => operationsApi.getOperationItems(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (existingOp) {
      setLoadNumber(existingOp.load_number || '')
      setDriverName(existingOp.driver_name || '')
      setVehiclePlate(existingOp.vehicle_plate || '')
      let n = existingOp.notes || ''
      let h = ''
      if (n.startsWith('Ajudante: ')) {
        const lines = n.split('\n')
        h = lines[0].replace('Ajudante: ', '').trim()
        n = lines.slice(1).join('\n')
      }
      setHelperName(h)
      setNotes(n)
    }
  }, [existingOp])

  useEffect(() => {
    if (existingItems.length > 0 && items.length === 0) {
      setItems(existingItems.map((i, idx) => ({
        tempId: `e${idx}`,
        product_id: i.product_id,
        product_code: i.product_code,
        description: i.description,
        quantity_expected: i.quantity_expected
      })))
    }
  }, [existingItems])

  const createMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.createOperation(data.op, data.items),
    onSuccess: () => {
      toast.success('Carga criada com sucesso!')
      navigate('/cargas')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar carga: ${error.message}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.updateOperationFull(id!, data.op, data.items),
    onSuccess: () => {
      toast.success('Carga atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
      navigate(`/conferencia/${id}`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar carga: ${error.message}`)
    }
  })

  // Helper to strip non-alphanumeric characters and uppercase for comparison
  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  useEffect(() => {
    if (codeSearch.trim().length > 0) {
      const term = normalizeCode(codeSearch.trim());
      const filtered = products.filter(p => 
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
  }, [codeSearch, products]);

  const addExactMatch = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;
    const term = normalizeCode(raw);
    const product = products.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    if (!product) { 
      toast.error('Produto não encontrado com esse código exato'); 
      return; 
    }
    addSelectedProduct(product);
  }

  const addSelectedProduct = (product: any) => {
    const exists = items.find(i => i.product_code === product.code)
    const currentQty = exists ? exists.quantity_expected : 0
    
    if (currentQty + 1 > product.stock) {
      toast.error(`Estoque insuficiente para ${product.description}. Disponível: ${product.stock}`)
      return
    }

    if (exists) {
      setItems(prev => prev.map(i => i.product_code === product.code ? { ...i, quantity_expected: i.quantity_expected + 1 } : i))
      toast.success(`Quantidade aumentada para ${product.description}`)
    } else {
      setItems(prev => [...prev, { tempId: `t${Date.now()}`, product_id: product.id, product_code: product.code, description: product.description, quantity_expected: 1 }])
      toast.success(`${product.description} adicionado`)
    }
    setCodeSearch('')
    setShowDropdown(false)
  }

  const updateQty = (tempId: string, qty: number) => {
    setItems(prev => prev.map(i => {
      if (i.tempId === tempId) {
        const product = products.find(p => p.code === i.product_code)
        const maxQty = product?.stock || 0
        if (qty > maxQty) {
          toast.error(`Estoque insuficiente. Apenas ${maxQty} unidades disponíveis de ${i.description}.`)
          return { ...i, quantity_expected: maxQty }
        }
        return { ...i, quantity_expected: Math.max(1, qty) }
      }
      return i
    }))
  }

  if (!isManager) {
    return <Navigate to="/cargas" replace />
  }

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][]

        let addedCount = 0
        let notFoundCount = 0

        const newItems: NewItem[] = []

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue

          let parts = row.map(cell => {
            if (cell === undefined || cell === null) return ''
            return String(cell).trim()
          }).filter(Boolean)

          if (parts.length < 2) continue

          const firstPart = parts[0].toLowerCase()
          if (firstPart.includes('cod') || firstPart.includes('código') || firstPart.includes('itens') || firstPart.includes('relatório') || firstPart.includes('delicius') || firstPart.includes('quantidade')) {
            continue
          }

        const codePart = parts[0]
        const qtyPart = parts[parts.length - 1]

        let rawCode = codePart
        if (rawCode.includes(' - ')) {
          rawCode = rawCode.split(' - ')[0].trim()
        }
        let code = rawCode;
        if (!code) continue;
      
      const normalizedImportCode = normalizeCode(code);
      // STRICT MATCH ONLY FOR IMPORTS
      const product = products.find(p => normalizeCode(p.code) === normalizedImportCode || (p.external_code && normalizeCode(p.external_code) === normalizedImportCode));

      if (product) {
        // Safely parse formats like "1,00" or "1.00" to integer 1
        const qty = Math.round(parseFloat(qtyPart.replace(',', '.')))

        if (code && !isNaN(qty)) {
          if (product) {
            let finalQty = qty
            if (finalQty > product.stock) {
              finalQty = product.stock
              toast.error(`Falta de estoque: ${product.description}. Pedido: ${qty}, Disponível: ${product.stock}. Ajustado automaticamente.`)
            }

            // Check if already in items list (existing)
            const exists = items.some(it => it.product_code === product.code) || newItems.some(it => it.product_code === product.code)
            if (!exists && finalQty > 0) {
              newItems.push({
                tempId: `t${Date.now()}_${addedCount}`,
                product_id: product.id,
                product_code: product.code,
                description: product.description, // User description discarded, fetched from DB
                quantity_expected: Math.max(1, finalQty)
              })
              addedCount++
            }
          } else {
            notFoundCount++
          }
        }
      }

        if (newItems.length > 0) {
          setItems(prev => [...prev, ...newItems])
          toast.success(`${addedCount} itens importados com sucesso.`)
        }
        
        if (notFoundCount > 0) {
          toast.info(`${notFoundCount} linhas ignoradas (cabeçalhos de grupo ou não encontrados).`)
        }
      } catch (error) {
        toast.error('Erro ao processar arquivo. Verifique o formato.')
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loadNumber || items.length === 0) {
      toast.error('Preencha o Nome da Rota e adicione itens')
      return
    }

    // Save new values to memory
    if (driverName.trim() && !savedDrivers.includes(driverName.trim())) {
      const newD = [...savedDrivers, driverName.trim()]
      setSavedDrivers(newD)
      localStorage.setItem('coletor_drivers', JSON.stringify(newD))
    }
    if (vehiclePlate.trim() && !savedVehicles.includes(vehiclePlate.trim())) {
      const newV = [...savedVehicles, vehiclePlate.trim()]
      setSavedVehicles(newV)
      localStorage.setItem('coletor_vehicles', JSON.stringify(newV))
    }
    if (helperName.trim() && !savedHelpers.includes(helperName.trim())) {
      const newH = [...savedHelpers, helperName.trim()]
      setSavedHelpers(newH)
      localStorage.setItem('coletor_helpers', JSON.stringify(newH))
    }

    const finalNotes = helperName.trim() ? `Ajudante: ${helperName.trim()}\n${notes}` : notes

    const opData = {
      type: 'LOAD' as const,
      status: 'pending' as const,
      load_number: loadNumber,
      client_name: 'Diversos', // Temporary default since we removed client
      driver_name: driverName,
      vehicle_plate: vehiclePlate,
      notes: finalNotes,
    }

    const itemsData = items.map(i => ({
      product_id: i.product_id,
      product_code: i.product_code,
      description: i.description,
      quantity_expected: i.quantity_expected,
      quantity_scanned: 0,
      status: 'pending' as const
    }))

    if (id) {
      updateMutation.mutate({ op: opData, items: itemsData })
    } else {
      createMutation.mutate({ op: opData, items: itemsData })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">{id ? 'Editar Rota' : 'Nova Rota'}</h1>
          <p className="text-sm text-muted-foreground">{id ? 'Atualizar operação existente' : 'Criar operação de expedição'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />Dados da Rota</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2"><Label>Nome da Rota *</Label><Input value={loadNumber} onChange={e => setLoadNumber(e.target.value)} placeholder="Ex: Rota Centro 01" required /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" />Transporte</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            
            {/* Hidden datalists for autocomplete */}
            <datalist id="drivers-list">
              {savedDrivers.map((d, i) => <option key={i} value={d} />)}
            </datalist>
            <datalist id="vehicles-list">
              {savedVehicles.map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="helpers-list">
              {savedHelpers.map((h, i) => <option key={i} value={h} />)}
            </datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Motorista</Label>
                <Input list="drivers-list" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nome ou selecione" />
              </div>
              <div className="space-y-2">
                <Label>Ajudante (Opcional)</Label>
                <Input list="helpers-list" value={helperName} onChange={e => setHelperName(e.target.value)} placeholder="Nome ou selecione" />
              </div>
              <div className="space-y-2">
                <Label>Veículo (Placa/Nome)</Label>
                <Input list="vehicles-list" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="ABC-1D23 ou FNM" />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />Itens da Carga
            </CardTitle>
            <div>
              <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Importar Planilha
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={codeSearch} 
                  onChange={e => setCodeSearch(e.target.value)} 
                  placeholder="Código exato ou busque por descrição..." 
                  className="pl-10" 
                  onKeyDown={e => { 
                    if (e.key === 'Enter') { 
                      e.preventDefault(); 
                      if (filteredProducts.length === 1 && normalizeCode(filteredProducts[0].code) === normalizeCode(codeSearch.trim())) {
                         addSelectedProduct(filteredProducts[0]);
                      } else {
                         addExactMatch(codeSearch); 
                      }
                    } 
                  }} 
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onFocus={() => { if (codeSearch.trim().length > 0) setShowDropdown(true) }}
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
                {showDropdown && codeSearch.trim().length > 0 && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
              <Button type="button" onClick={() => addExactMatch(codeSearch)}><Plus className="h-4 w-4" /></Button>
            </div>

            {items.length === 0 ? (
              <div className="glass-card text-center py-8"><p className="text-muted-foreground text-sm">Nenhum item adicionado</p></div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.tempId} className="glass-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <Input type="number" className="w-20 text-center" value={item.quantity_expected} onChange={e => updateQty(item.tempId, Number(e.target.value))} min={1} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.tempId)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Criar Rota')}
        </Button>
      </form>
    </div>
  )
}
