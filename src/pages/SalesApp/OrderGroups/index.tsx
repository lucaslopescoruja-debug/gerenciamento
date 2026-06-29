import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { Plus, Edit2, Trash2, Boxes } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { OrderGroup } from '@/types/database'

export default function OrderGroups() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<OrderGroup | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  })

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['order_groups'],
    queryFn: salesApi.getOrderGroups,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => salesApi.createOrderGroup({ ...data, company_id: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_groups'] })
      toast.success('Grupo criado com sucesso')
      handleCloseModal()
    },
    onError: (error: any) => toast.error(`Erro ao criar: ${error.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => salesApi.updateOrderGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_groups'] })
      toast.success('Grupo atualizado com sucesso')
      handleCloseModal()
    },
    onError: (error: any) => toast.error(`Erro ao atualizar: ${error.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: salesApi.deleteOrderGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_groups'] })
      toast.success('Grupo excluído com sucesso')
    },
    onError: (error: any) => {
      // Exibe uma mensagem mais amigável se for erro de restrição (pedidos vinculados)
      if (error.message.includes('violates foreign key constraint') || error.message.includes('Foreign key violation')) {
        toast.error('Não é possível excluir este grupo pois ele possui pedidos vinculados.')
      } else {
        toast.error(`Erro ao excluir: ${error.message}`)
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Nome do grupo é obrigatório')

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (group: OrderGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      active: group.active
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este grupo? Apenas grupos sem pedidos podem ser excluídos.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
    setFormData({ name: '', description: '', active: true })
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Boxes className="h-6 w-6" />
            Grupos de Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize pedidos para futura geração de rotas.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto shadow-md">
          <Plus className="h-4 w-4 mr-2" /> Novo Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Carregando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Nenhum grupo cadastrado.
          </div>
        ) : (
          groups.map((group: OrderGroup) => (
            <Card key={group.id} className={`transition-all hover:shadow-md ${!group.active ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span>{group.name}</span>
                  {!group.active && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Inativo</span>}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {group.description || 'Sem descrição'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(group.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(group)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                placeholder="Ex: 300 - Orla - 15/06"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Observações ou detalhes do grupo"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="active">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Grupos inativos não aparecem na listagem de pedidos.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
