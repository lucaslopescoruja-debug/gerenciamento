import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import type { Product } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toaster'
import { Plus, Pencil, Trash2, Search, Package, Upload, Archive, FileDown, ArrowRight, ScanLine, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function Products() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const { user, isMaster } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || isMaster

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto criado com sucesso')
      setIsDialogOpen(false)
      setEditingProduct(null)
    },
    onError: (e: any) => {
      const msg = e.message || ''
      if (msg.includes('products_company_code_key') || (msg.includes('unique constraint') && msg.includes('code'))) {
        toast.error('Código já está cadastrado')
      } else {
        toast.error(`Erro ao criar: ${e.message}`)
      }
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Product> }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto atualizado com sucesso')
      setIsDialogOpen(false)
      setEditingProduct(null)
    },
    onError: (e: any) => {
      const msg = e.message || ''
      if (msg.includes('products_company_code_key') || (msg.includes('unique constraint') && msg.includes('code'))) {
        toast.error('Código já está cadastrado')
      } else {
        toast.error(`Erro ao atualizar: ${e.message}`)
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.info('Produto removido')
    }
  })

  const deleteAllMutation = useMutation({
    mutationFn: productsApi.deleteAllProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Todos os produtos foram removidos.')
    },
    onError: (e: any) => {
      if (e.message?.includes('foreign key') || e.message?.includes('violates')) {
        toast.error('Existem produtos vinculados a cargas. Exclua as cargas primeiro.')
      } else {
        toast.error(`Erro ao remover: ${e.message}`)
      }
    }
  })

  const setAllStockTo100Mutation = useMutation({
    mutationFn: productsApi.setAllStockTo100,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Todo o estoque foi ajustado para 100 itens!')
    },
    onError: (e: any) => {
      toast.error(`Erro ao ajustar estoque: ${e.message}`)
    }
  })

  const filtered = products.filter(p =>
    p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.external_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [sortField, setSortField] = useState<'code' | 'description' | 'group_name' | 'stock' | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: 'code' | 'description' | 'group_name' | 'stock') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortedProducts = useMemo(() => {
    const sorted = [...filtered]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      const valA = a[sortField] ?? ''
      const valB = b[sortField] ?? ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' })
      }

      // Fallback/Numeric comparison for stock
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortAsc])

  const renderSortIcon = (field: 'code' | 'description' | 'group_name' | 'stock') => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code') as string,
      external_code: formData.get('external_code') as string,
      factory_code: formData.get('factory_code') as string,
      description: formData.get('description') as string,
      stock: Number(formData.get('stock')),
      min_stock_alert: Number(formData.get('min_stock_alert')),
      group_name: formData.get('group_name') as string,
      batch: formData.get('batch') as string,
    }

    if (data.stock < 0) {
      toast.error('A quantidade em estoque não pode ser negativa. O menor número permitido é 0.')
      return
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?. Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate(id)
    }
  }

  const executeImport = async (type: 'new' | 'stock') => {
    if (!selectedFile) return
    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        
        // raw: false faz com que o XLSX mantenha a formatação da célula como string (ex: '00123' não vira 123)
        // defval: '' preenche células vazias com string vazia
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }) as string[][]

        let count = 0
        let errors = 0
        let lastError = ''

        if (data.length <= 1) {
          toast.warning('O arquivo parece estar vazio.')
          setIsImporting(false)
          return
        }

        const headerRow = data[0].map(h => String(h).toLowerCase().trim())
        
        // Dynamic indexes mapping
        const idxId = headerRow.findIndex(h => h === 'id')
        const idxCode = headerRow.findIndex(h => h === 'código' || h === 'codigo' || h === 'cod.' || h === 'cod')
        const idxExt = headerRow.findIndex(h => h.includes('externo'))
        const idxDesc = headerRow.findIndex(h => h.includes('descrição') || h === 'descricao')
        const idxGroup = headerRow.findIndex(h => h === 'grupo')
        const idxStock = headerRow.findIndex(h => h === 'estoque' || h === 'quantidade' || h === 'qtd' || h === 'qtd.')
        const idxMinStock = headerRow.findIndex(h => h.includes('mínimo') || h.includes('alerta'))
        const idxBatch = headerRow.findIndex(h => h === 'lote')
        const idxWeight = headerRow.findIndex(h => h.includes('peso'))
        const idxBox = headerRow.findIndex(h => h.includes('caixa'))

        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          // Skip completely empty rows
          if (!row || row.every(cell => !cell)) continue

          // Função auxiliar para pegar o valor baseado no index dinâmico ou fallback posicional antigo
          const getVal = (idx: number, fallbackIdx: number) => {
            const val = idx >= 0 ? row[idx] : row[fallbackIdx]
            return val != null ? String(val).trim() : ''
          }

          if (type === 'new') {
            const code = getVal(idxCode, 0)
            const desc = getVal(idxDesc, 1)
            const ext = getVal(idxExt, 2)
            const group_name = getVal(idxGroup, 3)
            const rawQty = getVal(idxStock, 4)
            const batch = getVal(idxBatch, 5)
            const rawMinQty = getVal(idxMinStock, 6)
            const weight = getVal(idxWeight, 8) // Fallback posicional
            const boxQty = getVal(idxBox, 9)

            const qty = parseInt(rawQty || '0', 10)
            const min_qty = parseInt(rawMinQty || '0', 10)

            if (code && desc) {
              if (qty < 0) {
                errors++
                lastError = `Estoque do produto '${code}' não pode ser negativo (${qty})`
                continue
              }
              
              // Verifica se o produto já existe para fazer update ou create (Upsert)
              const existingProduct = products.find(p => p.code === code)

              try {
                const productData = {
                  code,
                  external_code: ext || undefined,
                  description: desc,
                  group_name: group_name || undefined,
                  stock: isNaN(qty) ? 0 : qty,
                  batch: batch || undefined,
                  min_stock_alert: isNaN(min_qty) ? 0 : min_qty,
                  unit_weight: weight ? parseFloat(weight.replace(',', '.')) : undefined,
                  box_quantity: boxQty ? parseInt(boxQty, 10) : undefined
                }

                if (existingProduct) {
                  await productsApi.updateProduct(existingProduct.id, productData)
                } else {
                  const newProduct = await productsApi.createProduct(productData)
                  // Adicionar o novo produto à lista local para evitar tentar criá-lo novamente no mesmo loop
                  products.push(newProduct)
                }
                count++
              } catch (err: any) {
                console.error(err)
                errors++
                const msg = err.message || ''
                if (msg.includes('products_company_code_key') || (msg.includes('unique constraint') && msg.includes('code'))) {
                  lastError = 'Código já está cadastrado'
                } else {
                  lastError = err.message || JSON.stringify(err)
                }
              }
            }
          } else {
            // type === 'stock' (Apenas Atualização de Estoque)
            // Lê o primeiro campo como código, e o último campo como quantidade
            const codeOrExt = getVal(idxCode, 0).replace(/[^a-zA-Z0-9]/g, '')
            const qtyPart = getVal(idxStock, row.length - 1)
            
            const qtyToAdd = Math.round(parseFloat(qtyPart.replace(',', '.')))

            if (codeOrExt && !isNaN(qtyToAdd)) {
              const prod = products.find(p => p.code === codeOrExt || p.external_code === codeOrExt)
              if (prod) {
                const newStock = (prod.stock || 0) + qtyToAdd
                if (newStock < 0) {
                  errors++
                  lastError = `Estoque resultante do produto ${prod.code} não pode ser negativo (${newStock})`
                  continue
                }
                try {
                  await productsApi.updateProduct(prod.id, { stock: newStock })
                  count++
                } catch (err) {
                  console.error(err)
                }
              }
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ['products'] })

        if (errors > 0) {
          toast.error(`${errors} itens falharam. Último erro: ${lastError}`)
        }

        if (count > 0) {
          toast.success(type === 'new' ? `${count} produtos importados com sucesso!` : `${count} estoques atualizados com sucesso!`)
        } else if (errors === 0) {
          toast.warning('Nenhum produto válido encontrado no arquivo.')
        }

      } catch (error) {
        toast.error('Erro ao ler a planilha. Verifique o formato do arquivo.')
      }

      setSelectedFile(null)
      setIsImporting(false)
      setIsImportOpen(false)
      setIsStockEntryOpen(false)
    }
    reader.readAsBinaryString(selectedFile)
  }

  const exportToCSV = () => {
    if (products.length === 0) {
      toast.warning('Nenhum produto para exportar.')
      return
    }

    const headers = ['ID', 'Código', 'Código Externo', 'Descrição', 'Grupo', 'Estoque', 'Estoque Mínimo Alerta', 'Lote', 'Peso Unit.', 'Qtd. Caixa', 'Data Criação']
    
    const rows = products.map(p => [
      p.id,
      p.code || '',
      p.external_code || '',
      p.factory_code || '',
      p.description || '',
      p.group_name || '',
      p.stock || 0,
      p.min_stock_alert || 0,
      p.batch || '',
      p.unit_weight || '',
      p.box_quantity || '',
      p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `produtos_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório exportado com sucesso!')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" /> Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos no estoque</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Link to="/contagens">
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border-0">
              <ScanLine className="h-4 w-4 mr-1.5" /> Contagens
            </Button>
          </Link>
          <Link to="/recebimentos">
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] border-0">
              <Package className="h-4 w-4 mr-1.5" /> Recebimento (Fábrica) <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          {isManager && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" /> Importar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileDown className="h-4 w-4 mr-1.5" /> Exportar
              </Button>
              {isMaster && (
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => {
                  if (window.confirm('CUIDADO: Isso irá apagar TODOS os produtos cadastrados. Tem certeza que deseja continuar?. Esta ação não pode ser desfeita.')) {
                    deleteAllMutation.mutate()
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Limpar
                </Button>
              )}
              {isMaster && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-500/30 text-amber-600 dark:text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" 
                  onClick={() => {
                    if (window.confirm('Deseja realmente ajustar o estoque de TODOS os produtos para 100 itens?')) {
                      setAllStockTo100Mutation.mutate()
                    }
                  }}
                  disabled={setAllStockTo100Mutation.isPending}
                >
                  <Package className="h-4 w-4 mr-1.5" /> Ajustar para 100
                </Button>
              )}
              <Button size="sm" onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Novo Produto
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por código ou descrição..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('code')}>
                <div className="flex items-center gap-1">
                  Código
                  {renderSortIcon('code')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('description')}>
                <div className="flex items-center gap-1">
                  Descrição
                  {renderSortIcon('description')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('group_name')}>
                <div className="flex items-center gap-1">
                  Grupo
                  {renderSortIcon('group_name')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1">
                  Estoque
                  {renderSortIcon('stock')}
                </div>
              </TableHead>
              {isManager && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={isManager ? 5 : 4} className="text-center py-12 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManager ? 5 : 4} className="text-center py-12 text-muted-foreground">
                  <FileDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="text-foreground">{product.code}</div>
                    {product.external_code && <div className="text-xs text-muted-foreground" title="Cód. Externo / EAN">EAN: {product.external_code}</div>}
                    {product.factory_code && <div className="text-xs text-blue-500" title="Cód. Fábrica">Fáb: {product.factory_code}</div>}
                  </TableCell>
                  <TableCell className="font-medium">{product.description}</TableCell>
                  <TableCell>
                    {product.group_name && <Badge variant="secondary">{product.group_name}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={
                        product.min_stock_alert !== undefined && product.min_stock_alert > 0
                          ? (product.stock < product.min_stock_alert ? 'destructive' : (product.stock < product.min_stock_alert * 1.5 ? 'warning' : 'success'))
                          : (product.stock >= 10 ? 'success' : product.stock >= 3 ? 'warning' : 'destructive')
                      }>
                        {product.stock}
                      </Badge>
                      {product.min_stock_alert !== undefined && product.min_stock_alert > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Mín: {product.min_stock_alert}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {isManager && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input id="code" name="code" defaultValue={editingProduct?.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_code">Cód. Externo (EAN)</Label>
                <Input id="external_code" name="external_code" defaultValue={editingProduct?.external_code} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factory_code">Cód. Fábrica</Label>
                <Input id="factory_code" name="factory_code" defaultValue={editingProduct?.factory_code} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input id="description" name="description" defaultValue={editingProduct?.description} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group_name">Grupo</Label>
                <Input id="group_name" name="group_name" defaultValue={editingProduct?.group_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">Lote</Label>
                <Input id="batch" name="batch" defaultValue={editingProduct?.batch} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque Atual</Label>
                <Input type="number" id="stock" name="stock" min={0} defaultValue={editingProduct?.stock || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_alert">Mínimo para Alerta</Label>
                <Input type="number" id="min_stock_alert" name="min_stock_alert" min={0} defaultValue={editingProduct?.min_stock_alert ?? 0} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) setSelectedFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar Produtos (CSV / Excel)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Cole a sua planilha ou importe o arquivo (.csv, .txt, .xlsx).<br />Formato esperado: <b>Cod. | Descrição | Cod Externo (opcional) | Grupo (opcional) | Quantidade (opcional) | Lote (opcional)</b></p>
            <Input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
              <Button onClick={() => executeImport('new')} disabled={!selectedFile || isImporting}>
                {isImporting ? 'Processando...' : 'Importar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockEntryOpen} onOpenChange={(open) => { setIsStockEntryOpen(open); if (!open) setSelectedFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrada de Estoque (CSV)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Formato: Cód (ou Externo); Descrição (ignorada); Qtd a somar</p>
            <Input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStockEntryOpen(false)}>Cancelar</Button>
              <Button onClick={() => executeImport('stock')} disabled={!selectedFile || isImporting}>
                {isImporting ? 'Processando...' : 'Atualizar Estoque'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
