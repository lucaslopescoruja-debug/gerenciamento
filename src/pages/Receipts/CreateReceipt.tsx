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
import { ArrowLeft, Plus, Trash2, ClipboardList, User, Search, Upload, Package } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NewItem {
  tempId: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
}

export default function CreateReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  
  const [loadNumber, setLoadNumber] = useState('') // Nota Fiscal / Identificador
  const [clientName, setClientName] = useState('') // Fornecedor
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<NewItem[]>([])
  
  const [codeSearch, setCodeSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)
  const [linkSearch, setLinkSearch] = useState('')
  
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
      setClientName(existingOp.client_name || '')
      setNotes(existingOp.notes || '')
    }
  }, [existingOp])

  useEffect(() => {
    if (existingItems.length > 0) {
      setItems(existingItems.map(item => ({
        tempId: item.id,
        product_id: item.product_id,
        product_code: item.product_code,
        description: item.description,
        quantity_expected: item.quantity_expected
      })))
    }
  }, [existingItems])

  const createMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.createOperation(data.op, data.items),
    onSuccess: () => {
      toast.success('Recebimento criado com sucesso!')
      navigate('/recebimentos')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar recebimento: ${error.message}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.updateOperationFull(id!, data.op, data.items),
    onSuccess: () => {
      toast.success('Recebimento atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
      navigate(`/conferencia/${id}`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar recebimento: ${error.message}`)
    }
  })

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
  }, [codeSearch, products])

  const handleAddManualItem = (product: any) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity_expected: i.quantity_expected + 1 } : i))
    } else {
      setItems([{
        tempId: Date.now().toString(),
        product_id: product.id,
        product_code: product.code,
        description: product.description,
        quantity_expected: 1
      }, ...items])
    }
    setCodeSearch('')
    setShowDropdown(false)
  }

  const handleUpdateItemQty = (tempId: string, qty: string) => {
    const val = parseInt(qty)
    if (isNaN(val) || val < 0) return
    setItems(items.map(i => i.tempId === tempId ? { ...i, quantity_expected: val } : i))
  }

  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter(i => i.tempId !== tempId))
  }

  const handleConfirmLink = async (product: any) => {
    if (!linkingItemId) return

    const itemToLink = items.find(i => i.tempId === linkingItemId)
    if (!itemToLink) return

    try {
      await productsApi.updateProduct(product.id, { external_code: itemToLink.product_code })
      
      setItems(items.map(i => {
        if (i.product_code === itemToLink.product_code) {
          return {
            ...i,
            product_id: product.id,
            description: product.description
          }
        }
        return i
      }))
      
      toast.success(`Código ${itemToLink.product_code} vinculado a ${product.description} com sucesso!`)
      setLinkingItemId(null)
      setLinkSearch('')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      toast.error('Erro ao vincular produto no sistema.')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        
        let parsedItems: NewItem[] = []
        let notFoundCount = 0

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageItems = textContent.items as any[]
          
          pageItems.sort((a, b) => {
            if (Math.abs(b.transform[5] - a.transform[5]) > 2) {
               return b.transform[5] - a.transform[5]
            }
            return a.transform[4] - b.transform[4]
          })

          let lines: string[] = []
          let currentLine = ""
          let currentY = -1

          pageItems.forEach(item => {
             if (currentY === -1 || Math.abs(currentY - item.transform[5]) <= 2) {
               currentLine += item.str + " "
               currentY = item.transform[5]
             } else {
               lines.push(currentLine.trim())
               currentLine = item.str + " "
               currentY = item.transform[5]
             }
          })
          if (currentLine) lines.push(currentLine.trim())

          for (const line of lines) {
             const match = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(CX|FD|UN)/)
             if (match) {
               const factoryCode = match[2]
               const desc = match[3]
               
               const suffix = line.substring(match[0].length)
               const tokens = suffix.trim().split(/\s+/)
               let qty = 1
               
               if (tokens.length >= 4) {
                 let qtyStr = tokens[tokens.length - 2]
                 qty = parseInt(qtyStr.split(',')[0].replace(/\./g, ''), 10)
               } else {
                 for (const tk of tokens) {
                   if (/^\d+,00$/.test(tk) || /^\d+$/.test(tk)) {
                      qty = parseInt(tk.split(',')[0], 10)
                   }
                 }
               }
               if (isNaN(qty) || qty === 0) qty = 1

               const normalizedCode = normalizeCode(factoryCode)
               const foundProduct = products.find(prod => {
                 const pCode = normalizeCode(prod.code)
                 const pExt = prod.external_code ? normalizeCode(prod.external_code) : null
                 return (pCode === normalizedCode || pExt === normalizedCode)
               })

               if (!foundProduct) notFoundCount++

               const existing = parsedItems.find(i => i.product_code === factoryCode)
               if (existing) {
                 existing.quantity_expected += qty
               } else {
                 parsedItems.push({
                   tempId: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                   product_id: foundProduct?.id || '',
                   product_code: factoryCode,
                   description: foundProduct ? foundProduct.description : desc,
                   quantity_expected: Math.max(1, qty)
                 })
               }
             }
          }
        }

        if (parsedItems.length > 0) {
          setItems(prev => [...parsedItems, ...prev])
          toast.success(`${parsedItems.length} produtos importados do PDF!`)
          if (notFoundCount > 0) {
            toast.warning(`${notFoundCount} produtos não encontrados. Por favor, vincule-os manualmente abaixo.`)
          }
        } else {
          toast.error('Nenhum produto válido encontrado no PDF.')
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro ao ler o arquivo PDF.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][]

        let notFoundCount = 0
        const parsedItems: NewItem[] = []

        data.forEach((row, index) => {
          if (index === 0) return // Skip header

          const codeCell = row[2]
          if (!codeCell) return

          const strCode = String(codeCell).trim()
          if (!strCode || strCode.toLowerCase() === 'código' || strCode.toLowerCase() === 'codigo') return

          const normalizedCode = normalizeCode(strCode)
          const isNumStr = /^\d+$/.test(normalizedCode)
          
          let foundProduct = null
          if (normalizedCode.length >= 2) {
             foundProduct = products.find(prod => {
               const pCode = normalizeCode(prod.code)
               const pExt = prod.external_code ? normalizeCode(prod.external_code) : null
               if (pCode === normalizedCode || pExt === normalizedCode) return true
               return false
             })
          }

          if (!foundProduct) {
            notFoundCount++
          }

          const descCell = row[4] || row[5] || row[3]
          let finalDesc = foundProduct ? foundProduct.description : (descCell ? String(descCell).trim() : 'Produto sem descrição')
          let finalCode = foundProduct ? foundProduct.code : strCode

          const qtyCell = row[11] || row[10] || row[12]
          let qty = 1
          if (qtyCell) {
             const strQty = String(qtyCell).trim()
             if (!strQty.includes('/') && !strQty.includes(':')) {
                const digitsOnly = strQty.replace(/[^\d]/g, '') 
                const parsed = parseInt(digitsOnly, 10)
                if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
                   qty = parsed
                }
             }
          }

          const existing = parsedItems.find(i => i.product_code === finalCode)
          if (existing) {
            existing.quantity_expected += qty
          } else {
            parsedItems.push({
              tempId: `import_${index}`,
              product_id: foundProduct?.id || '',
              product_code: finalCode,
              description: finalDesc,
              quantity_expected: qty
            })
          }
        })

        if (parsedItems.length > 0) {
          setItems([...parsedItems, ...items])
          toast.success(`${parsedItems.length} produtos importados com sucesso!`)
          if (notFoundCount > 0) {
            toast.warning(`${notFoundCount} produtos não encontrados no cadastro.`)
          }
        } else {
          toast.error('Nenhum produto válido encontrado na planilha.')
        }

      } catch (err) {
        toast.error('Erro ao ler a planilha.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      // Allow blind receipts
      if (!window.confirm('Você não adicionou nenhum item. Deseja criar um Recebimento Cego?')) {
        return
      }
    }

    const opData = {
      type: 'RECEIPT',
      status: 'pending',
      load_number: loadNumber,
      client_name: clientName,
      notes,
    }

    const itemsData = items.map(i => ({
      product_id: i.product_id || null,
      product_code: i.product_code,
      description: i.description,
      quantity_expected: i.quantity_expected,
      quantity_scanned: 0,
      status: 'pending'
    }))

    if (id) {
      updateMutation.mutate({ op: opData, items: itemsData })
    } else {
      createMutation.mutate({ op: opData, items: itemsData })
    }
  }

  if (!isManager) {
    return <Navigate to="/recebimentos" replace />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">{id ? 'Editar Recebimento' : 'Novo Recebimento'}</h1>
          <p className="text-sm text-muted-foreground">Registre a entrada de mercadorias da fábrica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" /> Dados do Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nota Fiscal / Documento</Label>
              <Input required placeholder="Ex: NF 12345" value={loadNumber} onChange={e => setLoadNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor / Origem</Label>
              <Input placeholder="Ex: Fábrica Matriz" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações (Opcional)</Label>
              <Input placeholder="Detalhes do recebimento" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-primary" /> Lista de Produtos (Expectativa)
            </CardTitle>
            <div className="flex items-center gap-2">
              <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-amber-600 dark:text-amber-600 dark:text-amber-400 hover:text-amber-600 hover:bg-amber-50">
                <Upload className="h-4 w-4 mr-2" /> Importar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por código ou descrição para adicionar..." className="pl-10" value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} onFocus={() => codeSearch.trim().length > 0 && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} />
              </div>
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => handleAddManualItem(p)}>
                      <div>
                        <p className="font-bold text-sm">{p.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.code} {p.external_code && `| ${p.external_code}`}</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-2 max-h-[400px] overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum produto adicionado. Você pode importar um Excel ou buscar acima.<br/>
                  Se quiser fazer um "Recebimento Cego", apenas clique em Salvar sem itens.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.tempId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background rounded-md border border-border gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground hidden sm:block">Qtd Esperada:</Label>
                        <Input type="number" min="1" value={item.quantity_expected} onChange={(e) => handleUpdateItemQty(item.tempId, e.target.value)} className="w-20 h-8 text-center" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.tempId)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
               <span className="text-sm font-bold text-muted-foreground">Total de Itens: {items.length}</span>
               <span className="text-sm font-bold text-muted-foreground">Volumes Esperados: {items.reduce((s,i)=>s+i.quantity_expected, 0)}</span>
            </div>

          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending || updateMutation.isPending}>
          <Package className="h-5 w-5 mr-2" />
          {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (id ? 'Atualizar Recebimento' : 'Criar Recebimento')}
        </Button>
      </form>
    </div>
  )
}
