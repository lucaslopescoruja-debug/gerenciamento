import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentsApi } from '@/api/equipments'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Plus, Search, Box, Edit2, History, AlertCircle } from 'lucide-react'
import { Equipment } from '@/types/database'

export default function EquipmentsList() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('can_manage_equipments')

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)

  // Form
  const [patrimony, setPatrimony] = useState('')
  const [type, setType] = useState('Freezer')
  const [model, setModel] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState<'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente'>('Disponível')

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentsApi.createEquipment(data),
    onSuccess: () => {
      toast.success('Equipamento cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentsApi.updateEquipment(editing!.id, data, 'Status Alterado Manualmente'),
    onSuccess: () => {
      toast.success('Equipamento atualizado!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patrimony || !type || !model) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    if (editing) {
      updateMutation.mutate({ patrimony, type, model, size, status })
    } else {
      createMutation.mutate({ patrimony, type, model, size, status })
    }
  }

  const openNew = () => {
    setEditing(null)
    setPatrimony('')
    setType('Freezer')
    setModel('')
    setSize('')
    setStatus('Disponível')
    setIsModalOpen(true)
  }

  const openEdit = (eq: Equipment) => {
    setEditing(eq)
    setPatrimony(eq.patrimony)
    setType(eq.type)
    setModel(eq.model)
    setSize(eq.size || '')
    setStatus(eq.status as any)
    setIsModalOpen(true)
  }

  const filtered = equipments.filter(eq => 
    eq.patrimony.toLowerCase().includes(search.toLowerCase()) ||
    eq.model.toLowerCase().includes(search.toLowerCase()) ||
    (eq.customer?.fantasy_name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Box className="h-6 w-6 text-primary" /> Ativos e Equipamentos
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de patrimônio e comodatos</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por patrimônio, modelo ou cliente..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(eq => (
          <Card key={eq.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-muted-foreground font-mono">{eq.patrimony}</div>
                  <div className="font-bold">{eq.type} {eq.model}</div>
                  {eq.size && <div className="text-sm text-muted-foreground">{eq.size}</div>}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  eq.status === 'Disponível' ? 'bg-green-100 text-green-700' :
                  eq.status === 'No Cliente' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {eq.status}
                </div>
              </div>

              {eq.customer && (
                <div className="text-sm bg-muted/50 p-2 rounded">
                  <span className="text-muted-foreground text-xs block">Cliente Atual:</span>
                  <span className="font-medium">{eq.customer.fantasy_name || eq.customer.legal_name}</span>
                </div>
              )}

              {canManage && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(eq)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <History className="h-4 w-4 mr-2" /> Histórico
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº Patrimônio / Série *</Label>
                <Input value={patrimony} onChange={e => setPatrimony(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Freezer">Freezer</option>
                  <option value="Geladeira">Geladeira</option>
                  <option value="Lixeira">Lixeira</option>
                  <option value="Windbanner">Windbanner</option>
                  <option value="Expositor">Expositor</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca/Modelo *</Label>
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Ex: Metalfrio" required />
              </div>
              <div className="space-y-2">
                <Label>Tamanho / Litragem</Label>
                <Input value={size} onChange={e => setSize(e.target.value)} placeholder="Ex: 400L" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Situação / Status *</Label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Disponível">Disponível (No Galpão)</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Teste">Em Teste</option>
                <option value="Danificado">Danificado / Sucata</option>
                <option value="No Cliente" disabled>No Cliente (Automático)</option>
              </select>
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
