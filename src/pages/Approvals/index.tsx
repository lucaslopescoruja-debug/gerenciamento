import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deliveriesApi } from '@/api/deliveries'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Check, X, Clock, Package, MapPin, Truck, ArrowLeft, AlertTriangle } from 'lucide-react'

// Helper for relative time
function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Agora mesmo'
  if (minutes < 60) return `Há ${minutes} min`
  const hoverHours = Math.floor(minutes / 60)
  if (hoverHours < 24) return `Há ${hoverHours}h`
  const days = Math.floor(hoverHours / 24)
  return `Há ${days} dias`
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const [activeTab, setActiveTab] = useState('stock_adjustments')

  const { data: approvals = [], isLoading: isLoadingApprovals } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: deliveriesApi.getPendingApprovals,
    refetchInterval: 60000 // poll every 60s
  })

  const { data: stockAdjustments = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ['pending_stock_adjustments'],
    queryFn: () => operationsApi.getPendingStockAdjustments(),
    refetchInterval: 60000 // poll every 60s
  })

  const { data: operationAlerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['pending_operation_alerts'],
    queryFn: () => operationsApi.getPendingOperationAlerts(),
    refetchInterval: 60000 // poll every 60s
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, finalQty }: { id: string, status: 'approved' | 'rejected', finalQty?: number }) => 
      deliveriesApi.resolveItemApproval(id, status, finalQty),
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'approved' ? 'Item liberado com sucesso!' : 'Liberação rejeitada.')
      queryClient.invalidateQueries({ queryKey: ['pending_approvals'] })
    }
  })

  const adjustStockMutation = useMutation({
    mutationFn: async ({ itemId, qty, systemStockAtLoad, productCode }: { itemId: string, qty: number, systemStockAtLoad: number, productCode: string }) => {
      const discrepancy = qty - systemStockAtLoad
      
      if (discrepancy !== 0) {
        await productsApi.incrementStockByCode(productCode, discrepancy)
      }
      
      const { data, error } = await supabase
        .from('operation_items')
        .update({ divergence_resolved: true })
        .eq('id', itemId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Estoque corrigido e divergência resolvida!')
      queryClient.invalidateQueries({ queryKey: ['pending_stock_adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao ajustar estoque: ${e.message}`)
    }
  })

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => operationsApi.resolveOperationAlert(alertId),
    onSuccess: () => {
      toast.success('Alerta marcado como lido!')
      queryClient.invalidateQueries({ queryKey: ['pending_operation_alerts'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao resolver alerta: ${e.message}`)
    }
  })

  const resolveAllAlertsMutation = useMutation({
    mutationFn: () => operationsApi.resolveAllOperationAlerts(),
    onSuccess: () => {
      toast.success('Todos os alertas foram arquivados!')
      queryClient.invalidateQueries({ queryKey: ['pending_operation_alerts'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao arquivar alertas: ${e.message}`)
    }
  })

  const isLoading = isLoadingApprovals || isLoadingStock || isLoadingAlerts

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 slide-in">
        <AlertTriangle className="h-16 w-16 text-amber-600 dark:text-amber-600 dark:text-amber-400 opacity-80" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-center max-w-md">Apenas gestores e administradores têm permissão para acessar o painel de liberações.</p>
        <Link to="/dashboard">
          <Button variant="outline" className="mt-4">Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando solicitações...</div>

  return (
    <div className="space-y-6 slide-in">
      <div className="flex items-center gap-4">
        <Link to="/cargas">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Liberações e Ajustes</h1>
          <p className="text-muted-foreground mt-2">Aprove liberações de motoristas, ajuste divergências de estoque ou tome ciência de cortes no despacho.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full max-w-xl mb-6 h-auto gap-2 bg-transparent sm:bg-muted p-0 sm:p-1">
          <TabsTrigger value="stock_adjustments" className="relative w-full sm:w-auto">
            Ajustes de Cargas
            {stockAdjustments.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                {stockAdjustments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="load_shortages" className="relative w-full sm:w-auto">
            Faltas de Cargas
            {operationAlerts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {operationAlerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transit_approvals" className="relative w-full sm:w-auto">
            Entregas em Trânsito
            {approvals.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded-full">
                {approvals.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock_adjustments" className="space-y-4 mt-0">
          {stockAdjustments.length === 0 ? (
            <div className="glass-card text-center py-16 px-4">
              <Check className="h-12 w-12 mx-auto text-emerald-600 dark:text-emerald-600 dark:text-emerald-400/50 mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Tudo em ordem!</h2>
              <p className="text-muted-foreground">Não há nenhuma divergência de estoque física aguardando ajuste no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockAdjustments.map((item: any) => {
                const actualProduct = allProducts.find((p: any) => p.code === item.product_code || (p.external_code && p.external_code === item.product_code))
                const currentStock = actualProduct ? actualProduct.stock : 0
                const discrepancy = (item.quantity_scanned || 0) - (item.system_stock_at_load || 0)

                return (
                  <Card key={item.id} className="glass-card border-amber-500/20 overflow-hidden">
                    <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pendente de Ajuste
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Carga #{item.operation?.load_number || '---'}
                      </span>
                    </div>
                    
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">{item.description}</h3>
                        <p className="text-sm font-mono text-muted-foreground mt-1">Cód: {item.product_code}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background/50 rounded-lg p-3 font-mono border border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase mb-1">Carga</span>
                          <span className="text-base font-bold text-foreground">{item.system_stock_at_load ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase mb-1">Físico</span>
                          <span className="text-base font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400">{item.quantity_scanned}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase mb-1">Atual</span>
                          <span className="text-base font-bold text-muted-foreground">{currentStock}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                        <p className="flex items-start gap-2">
                          <Truck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                          <span>
                            <span className="font-semibold text-foreground">Conferente:</span> {item.operation?.driver_name || '---'}
                          </span>
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          Correção: adicionar +{discrepancy} un no estoque.
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {isManager ? (
                          <Button 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] font-semibold"
                            onClick={() => {
                              if (window.confirm(`Deseja corrigir o estoque do produto "${item.description}" adicionando +${discrepancy} unidades?`)) {
                                adjustStockMutation.mutate({ 
                                  itemId: item.id, 
                                  qty: item.quantity_scanned,
                                  systemStockAtLoad: item.system_stock_at_load ?? 0,
                                  productCode: item.product_code
                                })
                              }
                            }}
                            disabled={adjustStockMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" /> Corrigir Estoque
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled title="Apenas administradores/gestores para efetuar o ajuste">
                            Permissão de Gestor Necessária
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="load_shortages" className="space-y-4 mt-0">
          {isManager && operationAlerts.length > 0 && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="text-red-500 hover:text-red-600 border-red-500/30 hover:bg-red-500/10 font-medium text-xs"
                onClick={() => {
                  if (window.confirm('Deseja marcar todos os alertas de corte de carga como lidos/arquivados?')) {
                    resolveAllAlertsMutation.mutate()
                  }
                }}
                disabled={resolveAllAlertsMutation.isPending}
              >
                Limpar Todos os Alertas
              </Button>
            </div>
          )}

          {operationAlerts.length === 0 ? (
            <div className="glass-card text-center py-16 px-4">
              <Check className="h-12 w-12 mx-auto text-emerald-600 dark:text-emerald-600 dark:text-emerald-400/50 mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Tudo em ordem!</h2>
              <p className="text-muted-foreground">Nenhum alerta de item faltante em despacho de carga no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operationAlerts.map((item: any) => (
                <Card key={item.id} className="glass-card border-red-500/20 overflow-hidden">
                  <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Falta no Despacho
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Carga #{item.operation?.load_number || '---'}
                    </span>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{item.description}</h3>
                      <p className="text-sm font-mono text-muted-foreground mt-1">Cód: {item.product_code}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-background/50 rounded-lg p-3 font-mono border border-border/50">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase mb-1">Esperado</span>
                        <span className="text-base font-bold text-foreground">{item.quantity_expected}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase mb-1">Carregado</span>
                        <span className="text-base font-bold text-foreground">{item.quantity_scanned}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-red-400 block uppercase mb-1">Falta/Corte</span>
                        <span className="text-base font-bold text-red-500">-{item.quantity_missing}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <p className="flex items-start gap-2">
                        <Truck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>
                          <span className="font-semibold text-foreground">Conferente:</span> {item.operation?.driver_name || '---'}
                        </span>
                      </p>
                      <span className="text-[11px] text-muted-foreground opacity-80 block">
                        Registrado em: {new Date(item.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold"
                        onClick={() => resolveAlertMutation.mutate(item.id)}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" /> Marcar como Lido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transit_approvals" className="space-y-4 mt-0">
          {approvals.length === 0 ? (
            <div className="glass-card text-center py-16 px-4">
              <Check className="h-12 w-12 mx-auto text-purple-500/50 mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Tudo limpo!</h2>
              <p className="text-muted-foreground">Não há nenhuma solicitação de liberação em trânsito pendente no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvals.map((item: any) => (
                <Card key={item.id} className="glass-card border-purple-500/20 overflow-hidden">
                  <div className="bg-purple-500/10 px-4 py-2 border-b border-purple-500/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Aguardando
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(item.created_at)}
                    </span>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{item.description}</h3>
                      <p className="text-sm font-mono text-muted-foreground mt-1">Cód: {item.product_code}</p>
                    </div>

                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border border-border">
                      <div className="text-center flex-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Qtd Esperada</p>
                        <p className="text-xl font-mono text-foreground">{item.quantity_expected}</p>
                      </div>
                      <div className="w-px h-8 bg-border"></div>
                      <div className="text-center flex-1">
                        <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Qtd Solicitada</p>
                        <p className="text-xl font-mono font-bold text-purple-500">{item.requested_qty}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <p className="flex items-start gap-2">
                        <Truck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>
                          <span className="font-semibold text-foreground">Rota:</span> {item.client?.route?.operation?.load_number || '---'} 
                          <br/>
                          <span className="text-xs opacity-70">Motorista: {item.client?.route?.driver?.name || '---'}</span>
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-600 dark:text-amber-400" />
                        <span>
                          <span className="font-semibold text-foreground">Cliente:</span> {item.client?.name || '---'}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline"
                        className="flex-1 text-red-500 hover:text-red-500 hover:bg-red-500/10 border-red-500/20"
                        onClick={() => resolveMutation.mutate({ id: item.id, status: 'rejected' })}
                        disabled={resolveMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" /> Rejeitar
                      </Button>
                      <Button 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        onClick={() => resolveMutation.mutate({ id: item.id, status: 'approved', finalQty: item.requested_qty })}
                        disabled={resolveMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" /> Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
