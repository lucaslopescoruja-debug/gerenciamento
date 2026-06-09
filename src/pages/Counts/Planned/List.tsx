import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, Map, LayoutGrid, CheckCircle2, Trash2, ArrowRight } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function PlannedInventoriesList() {
  const { user, company } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.is_super_admin
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newInvName, setNewInvName] = useState('')
  const [collectionRule, setCollectionRule] = useState<'any' | 'registered_only' | 'confirm_unknown'>('registered_only')
  const [divergenceRule, setDivergenceRule] = useState<'ignore_uncollected' | 'zero_uncollected'>('ignore_uncollected')

  const { data: inventories = [], isLoading } = useQuery({
    queryKey: ['planned_inventories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planned_inventories')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PlannedInventory[]
    }
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const companyId = company?.id || user?.company_id;
      if (!companyId) throw new Error("Nenhuma empresa selecionada");
      if (!newInvName.trim()) throw new Error("Nome é obrigatório");
      
      const { data, error } = await supabase.from('planned_inventories').insert([{
        name: newInvName.trim(),
        status: 'planning',
        company_id: companyId,
        collection_rule: collectionRule,
        divergence_rule: divergenceRule
      }]).select()
      
      if (error) throw error
      return data[0] as PlannedInventory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      toast.success('Inventário planejado criado!')
      setIsModalOpen(false)
      setNewInvName('')
      navigate(`/contagens/planejados/${data.id}/gestao`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`)
    }
  })

  const handleCreate = () => {
    createMutation.mutate()
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planned_inventories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      toast.success('Inventário excluído')
    }
  })

  const confirmDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este inventário e todas as suas contagens?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs font-bold">Planejamento</span>
      case 'in_progress': return <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded text-xs font-bold animate-pulse">Em Andamento</span>
      case 'completed': return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold">Finalizado</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contagens')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Inventários Planejados</h1>
          <p className="text-muted-foreground mt-1 text-sm">Contagem controlada por Setores e Áreas.</p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Inventário</span>
          </Button>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Inventário</DialogTitle>
            <DialogDescription>
              Defina o nome e as regras de coleta para este inventário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nome do Inventário</Label>
              <Input 
                value={newInvName} 
                onChange={e => setNewInvName(e.target.value)} 
                placeholder="Ex: Balanço Anual 2026" 
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-blue-500">Permissão de coleta (Bipagem)</Label>
              <RadioGroup value={collectionRule} onValueChange={(v: any) => setCollectionRule(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="c-any" />
                  <Label htmlFor="c-any" className="font-normal cursor-pointer">Permitir coletar qualquer código</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="registered_only" id="c-reg" />
                  <Label htmlFor="c-reg" className="font-normal cursor-pointer">Permitir coletar somente cadastrados</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confirm_unknown" id="c-conf" />
                  <Label htmlFor="c-conf" className="font-normal cursor-pointer">Pedir confirmação para desconhecidos</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-purple-500">Conferência de itens (Saldo final)</Label>
              <RadioGroup value={divergenceRule} onValueChange={(v: any) => setDivergenceRule(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ignore_uncollected" id="d-ign" />
                  <Label htmlFor="d-ign" className="font-normal cursor-pointer">Ignorar códigos não coletados</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zero_uncollected" id="d-zero" />
                  <Label htmlFor="d-zero" className="font-normal cursor-pointer">Considerar todos os códigos (Zerar saldos faltantes)</Label>
                </div>
              </RadioGroup>
            </div>

          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !newInvName.trim()}>
              {createMutation.isPending ? 'Criando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-10">Carregando...</div>
      ) : inventories.length === 0 ? (
        <div className="text-center py-10 glass-card">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-medium mb-1">Nenhum inventário</h3>
          <p className="text-muted-foreground">Comece criando o seu primeiro inventário planejado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {inventories.map(inv => (
            <Card key={inv.id} className="hover:border-primary/50 transition-colors border-primary/20">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(isManager ? `/contagens/planejados/${inv.id}/gestao` : `/contagens/planejados/${inv.id}/coleta`)}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg truncate">{inv.name}</h3>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Map className="h-3 w-3" /> Setores Mapeados</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Data: {new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isManager && (
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => confirmDelete(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => navigate(isManager ? `/contagens/planejados/${inv.id}/gestao` : `/contagens/planejados/${inv.id}/coleta`)}>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
