import { useState } from 'react'
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
import { Plus, Pencil, Trash2, Search, Package, Upload, Archive, FileDown, ArrowRight, ScanLine } from 'lucide-react'
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
  const isManager = user?.role === 'admin' || user?.role === 'gestor'

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
    onError: (e: any) => toast.error(`Erro ao criar: ${e.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Product> }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto atualizado com sucesso')
      setIsDialogOpen(false)
      setEditingProduct(null)
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
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

  const filtered = products.filter(p =>
    p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.external_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code') as string,
      external_code: formData.get('external_code') as string,
      description: formData.get('description') as string,
      stock: Number(formData.get('stock')),
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
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
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
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        let count = 0
        let errors = 0
        let lastError = ''

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue

          let parts = row.map(cell => cell != null ? String(cell).trim() : '').filter(Boolean)
          if (parts.length < 2) continue

          if (type === 'new') {
            const firstPart = parts[0].toLowerCase()
            if (firstPart.includes('cod') || firstPart.includes('código')) continue

            const code = parts[0]?.trim() || ''
            const desc = parts[1]?.trim() || ''
            const ext = parts[2]?.trim() || ''
            const group_name = parts[3]?.trim() || ''
            const qty = parseInt(parts[4]?.trim() || '0')
            const batch = parts[5]?.trim() || ''

            if (code && desc) {
              if (qty < 0) {
                errors++
                lastError = `Estoque do produto '${code}' não pode ser negativo (${qty})`
                continue
              }
              try {
                await productsApi.createProduct({
                  code,
                  external_code: ext,
                  description: desc,
                  group_name,
                  stock: qty,
                  batch,
                })
                count++
              } catch (err: any) {
                console.error(err)
                errors++
                lastError = err.message || JSON.stringify(err)
              }
            }
          } else {
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
            const codeOrExt = rawCode.replace(/[^a-zA-Z0-9]/g, '')
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

    const headers = ['ID', 'Código', 'Código Externo', 'Descrição', 'Grupo', 'Estoque', 'Lote', 'Peso Unit.', 'Qtd. Caixa', 'Data Criação']
    
    const rows = products.map(p => [
      p.id,
      p.code || '',
      p.external_code || '',
      p.description || '',
      p.group_name || '',
      p.stock || 0,
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
          {isManager && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" /> Importar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileDown className="h-4 w-4 mr-1.5" /> Exportar
              </Button>
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
              {isMaster && (
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => {
                  if (window.confirm('CUIDADO: Isso irá apagar TODOS os produtos cadastrados. Tem certeza que deseja continuar?')) {
                    deleteAllMutation.mutate()
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Limpar
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
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Estoque</TableHead>
              {isManager && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={isManager ? 5 : 4} className="text-center py-12 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManager ? 5 : 4} className="text-center py-12 text-muted-foreground">
                  <FileDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="text-foreground">{product.code}</div>
                    {product.external_code && <div className="text-xs text-muted-foreground">{product.external_code}</div>}
                  </TableCell>
                  <TableCell className="font-medium">{product.description}</TableCell>
                  <TableCell>
                    {product.group_name && <Badge variant="secondary">{product.group_name}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock >= 10 ? 'success' : product.stock >= 3 ? 'warning' : 'destructive'}>
                      {product.stock}
                    </Badge>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input id="code" name="code" defaultValue={editingProduct?.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_code">Cód. Externo</Label>
                <Input id="external_code" name="external_code" defaultValue={editingProduct?.external_code} />
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
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Atual</Label>
              <Input type="number" id="stock" name="stock" min={0} defaultValue={editingProduct?.stock || 0} />
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
