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
import { ArrowLeft, Plus, Map, LayoutGrid, CheckCircle2, Trash2, ArrowRight, Copy } from 'lucide-react'
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

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch original inventory
      const { data: invData, error: invErr } = await supabase.from('planned_inventories').select('*').eq('id', id).single()
      if (invErr) throw invErr

      // 2. Insert new inventory
      const { data: newInvData, error: newInvErr } = await supabase.from('planned_inventories').insert([{
        name: `${invData.name} (Cópia)`,
        status: 'planning',
        company_id: invData.company_id,
        collection_rule: invData.collection_rule,
        divergence_rule: invData.divergence_rule
      }]).select().single()
      if (newInvErr) throw newInvErr

      const newInvId = newInvData.id

      // 3. Fetch sectors
      const { data: sectorsData } = await supabase.from('planned_inventory_sectors').select('*').eq('inventory_id', id)
      
      // 4. Insert sectors and keep mapping
      const sectorMap: Record<string, string> = {} // oldId -> newId
      if (sectorsData && sectorsData.length > 0) {
        for (const sector of sectorsData) {
          const { data: newSector, error: secErr } = await supabase.from('planned_inventory_sectors').insert([{
            inventory_id: newInvId,
            name: sector.name,
            description: sector.description
          }]).select().single()
          if (!secErr && newSector) {
            sectorMap[sector.id] = newSector.id
          }
        }
      }

      // 5. Fetch areas
      const { data: areasData } = await supabase.from('planned_inventory_areas').select('*').eq('inventory_id', id)
      if (areasData && areasData.length > 0) {
        for (const area of areasData) {
          await supabase.from('planned_inventory_areas').insert([{
            inventory_id: newInvId,
            sector_id: area.sector_id ? sectorMap[area.sector_id] : null,
            area_number: area.area_number,
            name: area.name,
            description: area.description,
            status: 'pending'
          }])
        }
      }
      
      return newInvData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventories'] })
      toast.success('Inventário duplicado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(`Erro ao duplicar: ${error.message}`)
    }
  })

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Deseja duplicar este inventário? Apenas as configurações, setores e áreas serão copiados (sem as bipagens).')) {
      duplicateMutation.mutate(id)
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
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="collection" value="any" checked={collectionRule === 'any'} onChange={(e: any) => setCollectionRule(e.target.value)} />
                  <span className="text-sm">Permitir coletar qualquer código</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="collection" value="registered_only" checked={collectionRule === 'registered_only'} onChange={(e: any) => setCollectionRule(e.target.value)} />
                  <span className="text-sm">Permitir coletar somente cadastrados</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="collection" value="confirm_unknown" checked={collectionRule === 'confirm_unknown'} onChange={(e: any) => setCollectionRule(e.target.value)} />
                  <span className="text-sm">Pedir confirmação para desconhecidos</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-purple-500">Conferência de itens (Saldo final)</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="divergence" value="ignore_uncollected" checked={divergenceRule === 'ignore_uncollected'} onChange={(e: any) => setDivergenceRule(e.target.value)} />
                  <span className="text-sm">Ignorar códigos não coletados</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="divergence" value="zero_uncollected" checked={divergenceRule === 'zero_uncollected'} onChange={(e: any) => setDivergenceRule(e.target.value)} />
                  <span className="text-sm">Considerar todos os códigos (Zerar saldos faltantes)</span>
                </label>
              </div>
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
                    <>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={(e) => handleDuplicate(inv.id, e)} title="Duplicar Inventário">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); confirmDelete(inv.id); }} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
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
