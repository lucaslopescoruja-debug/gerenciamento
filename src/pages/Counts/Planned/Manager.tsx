import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory, PlannedInventoryArea } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, MapPin, Play, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react'

export default function PlannedInventoryManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const queryClient = useQueryClient()
  
  const [newAreaName, setNewAreaName] = useState('')

  const { data: inventory } = useQuery({
    queryKey: ['planned_inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventories').select('*').eq('id', id).single()
      if (error) throw error
      return data as PlannedInventory
    }
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['planned_inventory_areas', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_areas').select('*').eq('inventory_id', id).order('created_at', { ascending: true })
      if (error) throw error
      return data as PlannedInventoryArea[]
    }
  })

  const createAreaMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('planned_inventory_areas').insert([{
        inventory_id: id,
        name: newAreaName.trim()
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas', id] })
      setNewAreaName('')
      toast.success('Área adicionada')
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar área: ${error.message}`)
    }
  })

  const deleteAreaMutation = useMutation({
    mutationFn: async (areaId: string) => {
      const { error } = await supabase.from('planned_inventory_areas').delete().eq('id', areaId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas', id] })
      toast.success('Área removida')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'planning' | 'in_progress' | 'completed') => {
      const { error } = await supabase.from('planned_inventories').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory', id] })
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      if (status === 'in_progress') toast.success('Inventário liberado para coleta!')
      if (status === 'completed') toast.success('Inventário finalizado!')
      if (status === 'planning') toast.success('Inventário pausado/reaberto!')
    }
  })

  if (!isManager) {
    return <div className="p-8 text-center text-red-500">Acesso negado. Apenas gestores podem acessar esta página.</div>
  }

  if (!inventory) return <div className="p-8 text-center">Carregando...</div>

  const isPlanning = inventory.status === 'planning'
  const isInProgress = inventory.status === 'in_progress'
  const isCompleted = inventory.status === 'completed'

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contagens/planejados')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight gradient-text truncate">Gestão: {inventory.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              isPlanning ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
              isInProgress ? 'bg-blue-500/20 text-blue-500' :
              'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isPlanning ? 'Em Planejamento' : isInProgress ? 'Em Andamento' : 'Finalizado'}
            </span>
          </p>
        </div>
      </div>

      {/* Áreas Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" /> Mapeamento de Áreas
          </CardTitle>
          {isPlanning && <p className="text-sm text-muted-foreground">Cadastre os corredores, prateleiras ou zonas que serão contadas.</p>}
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          
          {isPlanning && (
            <div className="flex gap-2">
              <Input
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                placeholder="Nome da área (ex: Corredor A, Freezer 2)"
                onKeyDown={e => { if (e.key === 'Enter' && newAreaName.trim()) createAreaMutation.mutate() }}
              />
              <Button onClick={() => createAreaMutation.mutate()} disabled={!newAreaName.trim() || createAreaMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
          )}

          {areas.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
              Nenhuma área cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {areas.map(area => (
                <div key={area.id} className="flex items-center justify-between p-3 glass-card rounded-lg border border-border/50">
                  <span className="font-medium text-sm">{area.name}</span>
                  {isPlanning && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => deleteAreaMutation.mutate(area.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls Section */}
      <Card className="border-primary/20 bg-background/50">
        <CardContent className="p-6">
          <h3 className="font-bold mb-4">Controle do Inventário</h3>
          
          {isPlanning && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quando terminar de mapear as áreas, inicie o inventário para liberar a coleta para os operadores no aplicativo.
              </p>
              <Button 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
                onClick={() => {
                  if (areas.length === 0) {
                    toast.error('Cadastre pelo menos uma área antes de iniciar!')
                    return
                  }
                  if (window.confirm('Iniciar inventário? Os operadores poderão começar a bipar.')) {
                    updateStatusMutation.mutate('in_progress')
                  }
                }}
              >
                <Play className="mr-2 h-5 w-5" /> Iniciar Inventário
              </Button>
            </div>
          )}

          {isInProgress && (
            <div className="space-y-4">
              <p className="text-sm text-blue-500 font-medium">
                O inventário está liberado. Os operadores podem realizar a coleta neste momento.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1 h-12 text-lg bg-emerald-600 hover:bg-emerald-700" 
                  onClick={() => {
                    if (window.confirm('Deseja finalizar o inventário e fechar a coleta?')) {
                      updateStatusMutation.mutate('completed')
                    }
                  }}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar Inventário
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-12 text-lg" 
                  onClick={() => {
                    if (window.confirm('Pausar inventário? Ninguém poderá bipar até que ele seja reaberto.')) {
                      updateStatusMutation.mutate('planning')
                    }
                  }}
                >
                  Pausar (Voltar para Planejamento)
                </Button>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-500 font-medium">
                O inventário foi finalizado e a coleta está encerrada.
              </p>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-600">Módulo de Relatórios em breve</h4>
                  <p className="text-sm text-amber-600/80 mt-1">
                    A geração do relatório de divergências comparando a contagem de todas as áreas com o estoque base será implementada na próxima etapa.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full h-12 text-lg" 
                onClick={() => {
                  if (window.confirm('Reabrir inventário? Os operadores poderão voltar a bipar.')) {
                    updateStatusMutation.mutate('in_progress')
                  }
                }}
              >
                Reabrir Inventário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
