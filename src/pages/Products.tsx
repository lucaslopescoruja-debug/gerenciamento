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
import { Plus, Pencil, Trash2, Search, Package, Upload, Archive, FileDown } from 'lucide-react'

export default function Products() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

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
      const text = evt.target?.result as string
      const lines = text.split('\n')
      let count = 0

      let errors = 0
      let lastError = ''

      for (const line of lines) {
        const trimmed = line.trim().replace(/"/g, '')
        if (!trimmed) continue
        let parts = trimmed.split('\t')
        if (parts.length < 2) parts = trimmed.split(';')
        if (parts.length < 2) parts = trimmed.split(',')
        if (parts.length < 2) parts = trimmed.split(/\s{2,}/)
        if (parts.length < 2) continue

        if (type === 'new') {
          if (parts[0]?.trim().toLowerCase().includes('cod interno') || parts[0]?.trim().toLowerCase().includes('ean')) continue // skip header

          const codInterno = parts[0]?.trim() || ''
          const codPrincipal = parts.length >= 3 ? parts[1]?.trim() : ''
          const desc = parts.length >= 3 ? parts[2]?.trim() : parts[1]?.trim()
          const group_name = parts[3]?.trim() || ''
          const qty = parseInt(parts[4]?.trim() || '0')
          const batch = parts[5]?.trim() || ''

          const code = codPrincipal || codInterno
          const ext = codInterno !== code ? codInterno : ''

          if (code && desc) {
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
          const codeOrExt = parts[0]?.trim()
          const qtyToAdd = parseInt(parts[2]?.trim() || '0')
          if (codeOrExt && qtyToAdd) {
            const prod = products.find(p => p.code === codeOrExt || p.external_code === codeOrExt)
            if (prod) {
              try {
                await productsApi.updateProduct(prod.id, { stock: (prod.stock || 0) + qtyToAdd })
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

      setSelectedFile(null)
      setIsImporting(false)
      setIsImportOpen(false)
      setIsStockEntryOpen(false)
    }
    reader.readAsText(selectedFile)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" /> Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Importar
          </Button>
          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsStockEntryOpen(true)}>
            <Archive className="h-4 w-4 mr-1.5" /> Entrada Estoque
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Produto
          </Button>
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
              <Input type="number" id="stock" name="stock" defaultValue={editingProduct?.stock || 0} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if(!open) setSelectedFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar Produtos (CSV / Excel)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Cole a sua planilha ou importe o arquivo (.csv, .txt).<br/>Formato esperado: <b>Cod Interno | Cod Principal (EAN) | Descrição</b></p>
            <Input type="file" accept=".csv,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
              <Button onClick={() => executeImport('new')} disabled={!selectedFile || isImporting}>
                {isImporting ? 'Processando...' : 'Importar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockEntryOpen} onOpenChange={(open) => { setIsStockEntryOpen(open); if(!open) setSelectedFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrada de Estoque (CSV)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Formato: Cód (ou Externo); Descrição (ignorada); Qtd a somar</p>
            <Input type="file" accept=".csv,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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
