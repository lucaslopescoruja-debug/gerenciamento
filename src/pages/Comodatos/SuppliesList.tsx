import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliesApi } from '@/api/supplies'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Plus, Search, Package, Edit2, Trash2 } from 'lucide-react'
import type { Supply } from '@/types/database'

export default function SuppliesList() {
  const queryClient = useQueryClient()
  const { hasPermission, user } = useAuth()
  const canManage = hasPermission('can_manage_equipments') && user?.role !== 'mecanico'

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)

  // Form
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('un')
  const [stockQuantity, setStockQuantity] = useState('0')

  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ['supplies'],
    queryFn: suppliesApi.getSupplies
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Supply>) => suppliesApi.createSupply(data as any),
    onSuccess: () => {
      toast.success('Insumo cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Supply>) => suppliesApi.updateSupply(editing!.id, data),
    onSuccess: () => {
      toast.success('Insumo atualizado!')
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: suppliesApi.deleteSupply,
    onSuccess: () => {
      toast.success('Insumo removido!')
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !unit || !stockQuantity) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const payload = { name, unit, stock_quantity: parseFloat(stockQuantity) }

    if (editing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const openNew = () => {
    setEditing(null)
    setName('')
    setUnit('un')
    setStockQuantity('0')
    setIsModalOpen(true)
  }

  const openEdit = (sup: Supply) => {
    setEditing(sup)
    setName(sup.name)
    setUnit(sup.unit)
    setStockQuantity(sup.stock_quantity.toString())
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
      deleteMutation.mutate(id)
    }
  }

  const filtered = supplies.filter(sup => 
    sup.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!canManage) {
    return <div className="p-8 text-center text-muted-foreground">Você não tem permissão para acessar esta página.</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Estoque de Insumos/Peças
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie o estoque de peças usadas nas manutenções</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Insumo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome do insumo/peça..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sup => (
          <Card key={sup.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">{sup.name}</div>
                  <div className="text-sm text-muted-foreground">Atualizado em: {new Date(sup.updated_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className={`px-2 py-1 rounded text-lg font-bold ${sup.stock_quantity <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {sup.stock_quantity} {sup.unit}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(sup)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(sup.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
            Nenhum insumo encontrado.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Insumo/Peça' : 'Novo Insumo/Peça'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Peça / Insumo *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade de Medida *</Label>
                <select 
                  value={unit} 
                  onChange={e => setUnit(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="m">Metro (m)</option>
                  <option value="l">Litro (l)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Estoque Inicial *</Label>
                <Input type="number" step="0.01" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
