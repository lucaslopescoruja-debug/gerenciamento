import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PlannedInventory, PlannedInventorySector, PlannedInventoryArea, PlannedInventoryCount } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, MapPin, CheckCircle2, Play, Pause, Download, Trash2, MoreVertical, Search, ScanBarcode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

export default function PlannedInventoryManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.is_super_admin
  const queryClient = useQueryClient()
  
  const [isAddSectorOpen, setIsAddSectorOpen] = useState(false)
  const [newSectorName, setNewSectorName] = useState('')
  const [rangeStart, setRangeStart] = useState<number | ''>('')
  const [rangeEnd, setRangeEnd] = useState<number | ''>('')

  // Buscas
  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['planned_inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventories').select('*').eq('id', id).single()
      if (error) throw error
      return data as PlannedInventory
    }
  })

  const { data: sectors = [] } = useQuery({
    queryKey: ['planned_inventory_sectors', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_sectors').select('*').eq('inventory_id', id).order('created_at', { ascending: true })
      if (error) throw error
      return data as PlannedInventorySector[]
    }
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['planned_inventory_areas', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_areas').select('*').eq('inventory_id', id).order('area_number', { ascending: true })
      if (error) throw error
      return data as PlannedInventoryArea[]
    }
  })

  const { data: counts = [] } = useQuery({
    queryKey: ['planned_inventory_counts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('planned_inventory_counts').select('*').eq('inventory_id', id)
      if (error) throw error
      return data as PlannedInventoryCount[]
    }
  })

  // Mutações
  const statusMutation = useMutation({
    mutationFn: async (newStatus: 'planning' | 'in_progress' | 'completed') => {
      const { error } = await supabase.from('planned_inventories').update({ status: newStatus }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory', id] })
      toast.success('Status alterado')
    }
  })

  const addSectorMutation = useMutation({
    mutationFn: async () => {
      if (!newSectorName.trim() || !rangeStart || !rangeEnd) throw new Error("Preencha todos os campos corretamente")
      if (rangeStart > rangeEnd) throw new Error("Range final deve ser maior ou igual ao inicial")
      
      // 1. Criar o Setor
      const { data: sector, error: sectorError } = await supabase.from('planned_inventory_sectors').insert([{
        inventory_id: id,
        name: newSectorName.trim()
      }]).select().single()
      
      if (sectorError) throw sectorError

      // 2. Criar as Áreas do Range
      const areasToInsert = []
      for (let i = rangeStart; i <= rangeEnd; i++) {
        areasToInsert.push({
          inventory_id: id,
          sector_id: sector.id,
          name: `Área #${i}`,
          area_number: i
        })
      }

      const { error: areasError } = await supabase.from('planned_inventory_areas').insert(areasToInsert)
      if (areasError) throw areasError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_sectors', id] })
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas', id] })
      toast.success('Setor e áreas criados com sucesso!')
      setIsAddSectorOpen(false)
      setNewSectorName('')
      setRangeStart('')
      setRangeEnd('')
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteSectorMutation = useMutation({
    mutationFn: async (sectorId: string) => {
      const { error } = await supabase.from('planned_inventory_sectors').delete().eq('id', sectorId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_sectors', id] })
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas', id] })
      toast.success('Setor removido')
    }
  })

  if (!isManager) {
    return <div className="p-8 text-center">Acesso negado. Apenas gestores podem planejar inventários.</div>
  }

  if (invLoading) return <div className="p-8 text-center">Carregando...</div>
  if (!inventory) return <div className="p-8 text-center">Inventário não encontrado</div>

  // Estatísticas
  const areasWithCounts = new Set(counts.map(c => c.area_id))
  const completedAreas = areasWithCounts.size
  const totalAreas = areas.length
  
  const sectorsWithCounts = new Set(areas.filter(a => areasWithCounts.has(a.id)).map(a => a.sector_id))
  const completedSectors = sectorsWithCounts.size
  const totalSectors = sectors.length

  const totalCodes = new Set(counts.map(c => c.product_code)).size
  const totalItems = counts.reduce((acc, curr) => acc + curr.quantity, 0)

  const progressPercentage = totalAreas > 0 ? Math.round((completedAreas / totalAreas) * 100) : 0

  return (
    <div className="space-y-6 slide-in max-w-6xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contagens/planejados')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">{inventory.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Painel de Gestão e Acompanhamento</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {inventory.status === 'planning' && (
            <Button onClick={() => statusMutation.mutate('in_progress')} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" /> Iniciar Coleta
            </Button>
          )}
          {inventory.status === 'in_progress' && (
            <>
              <Button onClick={() => statusMutation.mutate('planning')} variant="outline" className="text-amber-500 border-amber-500/20">
                <Pause className="h-4 w-4 mr-2" /> Pausar Coleta
              </Button>
              <Button onClick={() => statusMutation.mutate('completed')} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar e Ajustar
              </Button>
            </>
          )}
          {inventory.status === 'completed' && (
            <Button variant="outline" className="border-green-500/50 text-green-500">
              <Download className="h-4 w-4 mr-2" /> Exportar Relatório Final
            </Button>
          )}
        </div>
      </div>

      {/* DASHBOARD SUMMARY (Estilo IS Collector) */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-muted-foreground">Progresso: {progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Setores</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">{completedSectors} / {totalSectors}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Operadores</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">-</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Áreas</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">{completedAreas} / {totalAreas}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Qtd códigos</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">{totalCodes}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Dispositivos</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">1</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Qtd total</span>
              <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">{totalItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTORS AND AREAS */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-bold">Mapeamento de Setores</h2>
        {inventory.status === 'planning' && (
          <Button size="sm" onClick={() => setIsAddSectorOpen(true)} className="gap-2">
            <MapPin className="h-4 w-4" /> Adicionar Setor
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sectors.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted-foreground/50">
            Nenhum setor mapeado. Adicione o primeiro setor para começar.
          </div>
        ) : (
          sectors.map(sector => {
            const sectorAreas = areas.filter(a => a.sector_id === sector.id)
            const completedInSector = sectorAreas.filter(a => areasWithCounts.has(a.id)).length
            const pct = sectorAreas.length > 0 ? Math.round((completedInSector / sectorAreas.length) * 100) : 0

            return (
              <Card key={sector.id} className="border-border/40 bg-card overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-bold">{sector.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-muted-foreground/30'}`}></div>
                      {pct}% concluído
                    </span>
                    {inventory.status === 'planning' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => {
                        if(confirm('Excluir este setor e TODAS as áreas dele?')) deleteSectorMutation.mutate(sector.id)
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {sectorAreas.map(area => {
                      const hasCount = areasWithCounts.has(area.id)
                      return (
                        <div 
                          key={area.id} 
                          className={`
                            px-4 py-2 rounded-md border-2 text-sm font-bold shadow-sm transition-all
                            ${hasCount 
                              ? 'border-green-500 bg-green-500/10 text-green-600' 
                              : 'border-red-500 bg-red-500/5 text-red-500 opacity-90'
                            }
                          `}
                        >
                          #{area.area_number}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Adicionar Setor */}
      <Dialog open={isAddSectorOpen} onOpenChange={setIsAddSectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" /> Adicionar setor
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right text-muted-foreground">Nome do setor:</Label>
              <Input 
                value={newSectorName} 
                onChange={e => setNewSectorName(e.target.value)} 
                autoFocus
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right text-muted-foreground">Range de áreas:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  min="1"
                  value={rangeStart} 
                  onChange={e => setRangeStart(parseInt(e.target.value) || '')} 
                  className="w-20 text-center"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <Input 
                  type="number"
                  min="1"
                  value={rangeEnd} 
                  onChange={e => setRangeEnd(parseInt(e.target.value) || '')} 
                  className="w-20 text-center"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => addSectorMutation.mutate()} disabled={addSectorMutation.isPending}>
              SALVAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
