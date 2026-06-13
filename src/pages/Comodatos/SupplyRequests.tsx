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
import { Plus, Tag, Check, X, Clock } from 'lucide-react'
import type { SupplyRequest } from '@/types/database'

export default function SupplyRequests() {
  const queryClient = useQueryClient()
  const { hasPermission, user } = useAuth()
  
  // O Gestor vê de todos. O mecânico vê só as dele.
  const isManager = hasPermission('can_manage_equipments') && user?.role !== 'mecanico'

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form
  const [supplyId, setSupplyId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['supply_requests'],
    queryFn: () => isManager ? suppliesApi.getSupplyRequests() : suppliesApi.getMechanicSupplyRequests(user?.id || '')
  })

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: suppliesApi.getSupplies
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliesApi.createSupplyRequest(data),
    onSuccess: () => {
      toast.success('Solicitação enviada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['supply_requests'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'aprovado' | 'rejeitado' }) => suppliesApi.updateSupplyRequestStatus(id, status),
    onSuccess: () => {
      toast.success('Status da solicitação atualizado!')
      queryClient.invalidateQueries({ queryKey: ['supply_requests'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] }) // atualiza estoque
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplyId || !quantity) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    createMutation.mutate({ 
      mechanic_id: user?.id,
      supply_id: supplyId,
      quantity_requested: parseFloat(quantity),
      notes
    })
  }

  const openNew = () => {
    setSupplyId('')
    setQuantity('')
    setNotes('')
    setIsModalOpen(true)
  }

  const handleApprove = (req: SupplyRequest) => {
    if (confirm('Aprovar esta solicitação? O estoque será reduzido.')) {
      updateStatusMutation.mutate({ id: req.id, status: 'aprovado' })
    }
  }

  const handleReject = (req: SupplyRequest) => {
    if (confirm('Rejeitar esta solicitação?')) {
      updateStatusMutation.mutate({ id: req.id, status: 'rejeitado' })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Solicitações de Peças
          </h1>
          <p className="text-sm text-muted-foreground">
            {isManager ? 'Aprove ou rejeite requisições de insumos' : 'Acompanhe e solicite novas peças ao gestor'}
          </p>
        </div>
        {!isManager && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <div className={`p-3 rounded-full ${
                  req.status === 'aprovado' ? 'bg-green-100 text-green-600' :
                  req.status === 'rejeitado' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {req.status === 'aprovado' ? <Check className="h-5 w-5" /> :
                   req.status === 'rejeitado' ? <X className="h-5 w-5" /> :
                   <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {req.quantity_requested} {req.supply?.unit} - {req.supply?.name}
                  </div>
                  {isManager && req.mechanic && (
                    <div className="text-sm text-muted-foreground">
                      Solicitante: <strong>{req.mechanic.name}</strong>
                    </div>
                  )}
                  {req.notes && (
                    <div className="text-sm mt-1 border-l-2 pl-2 text-muted-foreground">"{req.notes}"</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded text-sm font-bold flex items-center justify-center w-full md:w-auto ${
                  req.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                  req.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {req.status.toUpperCase()}
                </span>

                {isManager && req.status === 'pendente' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleApprove(req)} className="text-green-600 border-green-200 hover:bg-green-50">
                      Aprovar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReject(req)} className="text-red-600 border-red-200 hover:bg-red-50">
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && !isLoading && (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
            Nenhuma solicitação encontrada.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Peça/Insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Peça / Insumo *</Label>
              <select 
                value={supplyId} 
                onChange={e => setSupplyId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {supplies.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Estoque atual: {s.stock_quantity} {s.unit})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" step="0.01" min="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Observações / Motivo</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
