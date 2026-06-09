import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, Map, LayoutGrid, CheckCircle2, Trash2, ArrowRight } from 'lucide-react'

export default function PlannedInventoriesList() {
  const { user, isManager } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: inventories = [] } = useQuery({
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
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('planned_inventories').insert([{
        name,
        status: 'planning',
        company_id: user?.company_id
      }]).select()
      
      if (error) throw error
      if (!data || data.length === 0) throw new Error("Inserção falhou")
      return data[0] as PlannedInventory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      setIsCreating(false)
      setNewName('')
      toast.success('Inventário criado com sucesso!')
      navigate(`/contagens/planejados/${data.id}/gestao`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planned_inventories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      toast.success('Inventário excluído')
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`)
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createMutation.mutate(newName.trim())
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contagens')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Inventários Planejados</h1>
          <p className="text-muted-foreground mt-1 text-sm">Controle de estoque por áreas</p>
        </div>
      </div>

      {isManager && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            {!isCreating ? (
              <Button 
                className="w-full h-12 text-lg" 
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-5 w-5" /> Novo Inventário
              </Button>
            ) : (
              <form onSubmit={handleCreate} className="flex gap-2 items-center">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Inventário Geral - Junho 2026"
                  className="h-12 text-lg bg-background"
                  autoFocus
                />
                <Button type="submit" className="h-12 px-6" disabled={createMutation.isPending || !newName.trim()}>
                  Salvar
                </Button>
                <Button type="button" variant="ghost" className="h-12" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" /> Seus Inventários
        </h2>
        
        {inventories.length === 0 ? (
          <div className="glass-card text-center py-10">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum inventário planejado encontrado</p>
          </div>
        ) : (
          inventories.map(inv => (
            <Card key={inv.id} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors glass-card group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4">
                  <div className="min-w-0 mb-4 md:mb-0">
                    <h3 className="font-bold text-lg text-primary">{inv.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span>📅 {new Date(inv.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inv.status === 'planning' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        inv.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {inv.status === 'planning' ? 'Em Planejamento' :
                         inv.status === 'in_progress' ? 'Em Andamento' : 'Finalizado'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {(inv.status === 'in_progress' || (inv.status === 'completed' && isManager)) && (
                      <Button 
                        variant={inv.status === 'in_progress' ? 'default' : 'outline'}
                        className="flex-1 md:flex-none"
                        onClick={() => navigate(`/contagens/planejados/${inv.id}/coleta`)}
                      >
                        <LayoutGrid className="mr-2 h-4 w-4" /> Coleta
                      </Button>
                    )}
                    
                    {isManager && (
                      <Button 
                        variant={inv.status === 'planning' ? 'default' : 'outline'}
                        className="flex-1 md:flex-none border-primary/30"
                        onClick={() => navigate(`/contagens/planejados/${inv.id}/gestao`)}
                      >
                        Gestão <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {isManager && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
                        onClick={() => { 
                          if (window.confirm('CUIDADO: Isso excluirá o inventário e TODAS as suas coletas. Tem certeza?')) {
                            deleteMutation.mutate(inv.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
