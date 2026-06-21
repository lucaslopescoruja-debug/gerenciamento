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
import * as XLSX from 'xlsx'
import { ArrowLeft, Plus, MapPin, CheckCircle2, Play, Pause, Download, Trash2, MoreVertical, Search, ScanBarcode, CloudDownload, FileX, ShieldAlert, ListChecks, FileText, Pencil } from 'lucide-react'
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
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null)
  const [newSectorName, setNewSectorName] = useState('')
  const [rangeStart, setRangeStart] = useState<number | ''>('')
  const [rangeEnd, setRangeEnd] = useState<number | ''>('')
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)

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

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data
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

  const saveSectorMutation = useMutation({
    mutationFn: async () => {
      if (!newSectorName.trim() || !rangeStart || !rangeEnd) throw new Error("Preencha todos os campos corretamente")
      if (rangeStart > rangeEnd) throw new Error("Range final deve ser maior ou igual ao inicial")
      
      let sectorId = editingSectorId

      if (editingSectorId) {
        // Edit mode
        // 1. Update Sector name
        const { error: sectorError } = await supabase.from('planned_inventory_sectors').update({
          name: newSectorName.trim()
        }).eq('id', editingSectorId)
        if (sectorError) throw sectorError

        // 2. Delete existing areas for this sector
        const { error: delError } = await supabase.from('planned_inventory_areas').delete().eq('sector_id', editingSectorId)
        if (delError) throw delError

      } else {
        // Add mode
        // 1. Create Sector
        const { data: sector, error: sectorError } = await supabase.from('planned_inventory_sectors').insert([{
          inventory_id: id,
          name: newSectorName.trim()
        }]).select().single()
        
        if (sectorError) throw sectorError
        sectorId = sector.id
      }

      // 3. Create Areas
      const areasToInsert = []
      for (let i = rangeStart; i <= rangeEnd; i++) {
        areasToInsert.push({
          inventory_id: id,
          sector_id: sectorId,
          name: `Área #${i}`,
          area_number: i,
          status: 'pending'
        })
      }

      const { error: areasError } = await supabase.from('planned_inventory_areas').insert(areasToInsert)
      if (areasError) throw areasError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_sectors', id] })
      queryClient.invalidateQueries({ queryKey: ['planned_inventory_areas', id] })
      toast.success(editingSectorId ? 'Setor atualizado com sucesso!' : 'Setor e áreas criados com sucesso!')
      setIsAddSectorOpen(false)
      setNewSectorName('')
      setRangeStart('')
      setRangeEnd('')
      setEditingSectorId(null)
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

  const handleEditSector = (sector: PlannedInventorySector) => {
    const sectorAreas = areas.filter(a => a.sector_id === sector.id)
    const minArea = sectorAreas.length > 0 ? Math.min(...sectorAreas.map(a => a.area_number || 0)) : ''
    const maxArea = sectorAreas.length > 0 ? Math.max(...sectorAreas.map(a => a.area_number || 0)) : ''
    
    setEditingSectorId(sector.id)
    setNewSectorName(sector.name)
    setRangeStart(minArea)
    setRangeEnd(maxArea)
    setIsAddSectorOpen(true)
  }

  const exportTXT = () => {
    if (counts.length === 0) return toast.info('Nenhuma contagem para exportar.')
    
    // Formato: codigo;quantidade;extra_info
    const lines = counts.map(c => `${c.product_code};${c.quantity};${c.extra_info || ''}`)
    const content = lines.join('\n')
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contagem_${inventory?.name.replace(/\s+/g, '_')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = (type: 'padrao' | 'nao_coletados' | 'divergencias' | 'posicoes' | 'conferencias' | 'resumo_final') => {
    let data: any[] = []
    let filename = ''

    if (type === 'padrao') {
      if (counts.length === 0) return toast.info('Nenhuma contagem para exportar.')
      data = counts.map(c => {
        const area = areas.find(a => a.id === c.area_id)
        const sector = sectors.find(s => s.id === area?.sector_id)
        const product = allProducts.find(p => p.code === c.product_code)
        return {
          Setor: sector?.name || '',
          Area: area?.name || '',
          Codigo: c.product_code,
          Descricao: product?.description || 'Desconhecido',
          Quantidade: c.quantity,
          InformacaoExtra: c.extra_info || '',
          DataColeta: new Date(c.created_at).toLocaleString()
        }
      })
      filename = `contagem_${inventory?.name}`
    } else if (type === 'nao_coletados') {
      const collectedCodes = new Set(counts.map(c => c.product_code))
      const notCollected = allProducts.filter(p => !collectedCodes.has(p.code))
      if (notCollected.length === 0) return toast.info('Nenhum item não coletado.')
      data = notCollected.map(p => ({
        Codigo: p.code,
        Descricao: p.description,
        Categoria: p.group_name || '',
        EstoqueSistema: p.stock || 0
      }))
      filename = `nao_coletados_${inventory?.name}`
    } else if (type === 'divergencias') {
      const grouped = counts.reduce((acc, curr) => {
        if (!acc[curr.product_code]) acc[curr.product_code] = 0
        acc[curr.product_code] += curr.quantity
        return acc
      }, {} as Record<string, number>)

      const divergenceData: any[] = []

      // 1. Avaliar tudo que foi coletado
      Object.entries(grouped).forEach(([code, qty]) => {
        const product = allProducts.find(p => p.code === code)
        const sysStock = product?.stock || 0
        if (qty !== sysStock) {
          divergenceData.push({
            Codigo: code,
            Descricao: product?.description || 'Desconhecido',
            EstoqueSistema: sysStock,
            Coletado: qty,
            Divergencia: qty - sysStock
          })
        }
      })

      // 2. Avaliar itens do sistema que não foram coletados mas tem estoque > 0
      allProducts.forEach(p => {
        if (!grouped[p.code] && (p.stock || 0) > 0) {
          divergenceData.push({
            Codigo: p.code,
            Descricao: p.description,
            EstoqueSistema: p.stock,
            Coletado: 0,
            Divergencia: -(p.stock)
          })
        }
      })

      if (divergenceData.length === 0) return toast.info('Nenhuma divergência encontrada!')
      data = divergenceData
      filename = `divergencias_${inventory?.name}`
    } else if (type === 'resumo_final') {
      // Resumo por Setor/Area
      data = areas.map(area => {
        const sector = sectors.find(s => s.id === area.sector_id)
        const areaCounts = counts.filter(c => c.area_id === area.id)
        const totalQty = areaCounts.reduce((acc, c) => acc + c.quantity, 0)
        const uniqueCodes = new Set(areaCounts.map(c => c.product_code)).size
        return {
          Setor: sector?.name || 'Sem Setor',
          Area: area.name,
          Status: area.status,
          ItensBipados: totalQty,
          CodigosDistintos: uniqueCodes
        }
      })
      filename = `resumo_final_${inventory?.name}`
    } else if (type === 'posicoes' || type === 'conferencias') {
      // Log detalhado de coletas
      data = counts.map(c => {
        const area = areas.find(a => a.id === c.area_id)
        const sector = sectors.find(s => s.id === area?.sector_id)
        return {
          Setor: sector?.name || '',
          Area: area?.name || '',
          Codigo: c.product_code,
          Quantidade: c.quantity,
          Data: new Date(c.created_at).toLocaleString(),
        }
      })
      filename = `${type}_${inventory?.name}`
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio")
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

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
          <Button onClick={() => setIsReportsModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white font-medium border-0">
            <CloudDownload className="h-4 w-4 mr-2" /> Relatórios
          </Button>
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
              <Card key={sector.id} className="border-border/40 bg-card">
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
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => handleEditSector(sector)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => {
                          if(confirm('Excluir este setor e TODAS as áreas dele?')) deleteSectorMutation.mutate(sector.id)
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {sectorAreas.map(area => {
                      const hasCount = areasWithCounts.has(area.id)
                      const areaCounts = counts.filter(c => c.area_id === area.id)
                      
                      const totalQty = areaCounts.reduce((acc, c) => acc + c.quantity, 0)
                      const uniqueCodes = new Set(areaCounts.map(c => c.product_code)).size
                      const operators = Array.from(new Set(areaCounts.map(c => c.user_name))).filter(Boolean).join(', ') || '-'
                      
                      const dates = areaCounts.map(c => new Date(c.created_at).getTime())
                      const startMs = dates.length ? Math.min(...dates) : null
                      const endMs = dates.length ? Math.max(...dates) : null
                      
                      const startStr = startMs ? new Date(startMs).toLocaleTimeString('pt-BR') : '-'
                      const endStr = endMs ? new Date(endMs).toLocaleTimeString('pt-BR') : '-'
                      
                      let durationStr = '-'
                      if (startMs && endMs) {
                        const diffSecs = Math.floor((endMs - startMs) / 1000)
                        const h = Math.floor(diffSecs / 3600)
                        const m = Math.floor((diffSecs % 3600) / 60)
                        const s = diffSecs % 60
                        durationStr = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
                      }

                      return (
                        <div 
                          key={area.id} 
                          className={`
                            relative group px-4 py-2 rounded-md border-2 text-sm font-bold shadow-sm transition-all cursor-default
                            ${hasCount 
                              ? 'border-green-500 bg-green-500/10 text-green-600' 
                              : 'border-red-500 bg-red-500/5 text-red-500 opacity-90'
                            }
                          `}
                        >
                          #{area.area_number}
                          
                          {/* Tooltip Card */}
                          <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-card border border-border rounded-lg shadow-xl text-left pointer-events-none p-4 before:content-[''] before:absolute before:bottom-[100%] before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-border dark:before:border-b-border">
                            <div className="font-bold text-base text-foreground mb-1">
                              Área #{area.area_number} - {sector.name}
                            </div>
                            
                            <div className="relative mt-3 mb-3">
                               <div className="absolute -top-2 left-2 px-1 bg-white dark:bg-card text-[10px] text-muted-foreground z-10">Endereço da área (Opcional)</div>
                               <div className="border border-border rounded p-2 pt-2.5 text-sm text-foreground bg-transparent min-h-[36px]">
                                 {area.name !== `Área #${area.area_number}` ? area.name : ''}
                               </div>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground flex flex-col">
                              <div className="flex justify-between"><span>Operador:</span> <span className="text-foreground font-medium">{operators}</span></div>
                              <div className="flex justify-between"><span>Início:</span> <span className="text-foreground font-medium">{startStr}</span></div>
                              <div className="flex justify-between"><span>Término:</span> <span className="text-foreground font-medium">{endStr}</span></div>
                              <div className="flex justify-between"><span>Duração:</span> <span className="text-foreground font-medium">{durationStr}</span></div>
                              <div className="flex justify-between"><span>Qtd códigos:</span> <span className="text-foreground font-medium">{uniqueCodes}</span></div>
                              <div className="flex justify-between"><span>Qtd total:</span> <span className="text-foreground font-medium">{totalQty}</span></div>
                            </div>
                          </div>
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

      {/* Modal Adicionar/Editar Setor */}
      <Dialog open={isAddSectorOpen} onOpenChange={(open) => {
        setIsAddSectorOpen(open)
        if (!open) {
          setEditingSectorId(null)
          setNewSectorName('')
          setRangeStart('')
          setRangeEnd('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" /> {editingSectorId ? 'Editar setor' : 'Adicionar setor'}
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
            <Button variant="ghost" onClick={() => setIsAddSectorOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveSectorMutation.mutate()} disabled={saveSectorMutation.isPending || !newSectorName.trim()}>
              {saveSectorMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Relatórios */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="max-w-3xl bg-[#f5f5f5] p-0 overflow-hidden border-0">
          <div className="bg-[#0ea5e9] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudDownload className="h-6 w-6" />
              <h2 className="text-xl font-medium">Relatórios</h2>
            </div>
            <button onClick={() => setIsReportsModalOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full">
              <FileX className="h-5 w-5 opacity-0 pointer-events-none" /> {/* Placeholder para fechar */}
            </button>
          </div>
          
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Seção Contagem */}
            <div className="bg-white rounded-md shadow-sm p-4">
              <h3 className="text-gray-500 font-medium mb-4">Contagem</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#bce6f8] rounded-md p-6 flex flex-col items-center justify-center gap-4 text-center border border-[#9edbf5]">
                  <span className="text-[#555] font-medium">Arquivo TXT</span>
                  <Button variant="outline" className="bg-white text-[#0ea5e9] border-white hover:bg-white hover:text-[#0ea5e9] hover:shadow-md transition-all font-bold text-xs px-6 py-5" onClick={() => exportTXT()}>
                    BAIXAR
                  </Button>
                </div>
                <div className="bg-[#c8e6c9] rounded-md p-6 flex flex-col items-center justify-center gap-4 text-center border border-[#a5d6a7]">
                  <span className="text-[#555] font-medium">Arquivo Excel</span>
                  <Button variant="outline" className="bg-white text-[#0ea5e9] border-white hover:bg-white hover:text-[#0ea5e9] hover:shadow-md transition-all font-bold text-xs px-6 py-5" onClick={() => exportExcel('padrao')}>
                    BAIXAR
                  </Button>
                </div>
              </div>
            </div>

            {/* Seção Outros */}
            <div className="bg-white rounded-md shadow-sm p-4">
              <h3 className="text-gray-500 font-medium mb-4">Outros</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="h-auto w-[140px] py-6 flex flex-col items-center justify-center gap-3 bg-white border-border/50 hover:bg-sky-50 transition-colors rounded-md shadow-sm" onClick={() => exportExcel('nao_coletados')}>
                  <FileX className="h-7 w-7 text-[#0ea5e9]" />
                  <span className="text-[10px] text-[#0ea5e9] font-bold whitespace-normal text-center leading-tight">ITENS NÃO<br/>COLETADOS</span>
                </Button>
                <Button variant="outline" className="h-auto w-[140px] py-6 flex flex-col items-center justify-center gap-3 bg-white border-border/50 hover:bg-sky-50 transition-colors rounded-md shadow-sm" onClick={() => exportExcel('divergencias')}>
                  <ShieldAlert className="h-7 w-7 text-[#0ea5e9]" />
                  <span className="text-[10px] text-[#0ea5e9] font-bold whitespace-normal text-center leading-tight">DIVERGÊNCIAS</span>
                </Button>
                <Button variant="outline" className="h-auto w-[140px] py-6 flex flex-col items-center justify-center gap-3 bg-white border-border/50 hover:bg-sky-50 transition-colors rounded-md shadow-sm" onClick={() => exportExcel('posicoes')}>
                  <MapPin className="h-7 w-7 text-[#0ea5e9]" />
                  <span className="text-[10px] text-[#0ea5e9] font-bold whitespace-normal text-center leading-tight">POSIÇÕES</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 border-t flex justify-end">
             <Button variant="ghost" onClick={() => setIsReportsModalOpen(false)} className="text-gray-600 font-bold">FECHAR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
