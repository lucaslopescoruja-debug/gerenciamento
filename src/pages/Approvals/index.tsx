import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Check, X, Clock, Package, MapPin, Truck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ApprovalsPage() {
  const queryClient = useQueryClient()

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: deliveriesApi.getPendingApprovals,
    refetchInterval: 10000 // poll every 10s
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, finalQty }: { id: string, status: 'approved' | 'rejected', finalQty?: number }) => 
      deliveriesApi.resolveItemApproval(id, status, finalQty),
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'approved' ? 'Item liberado com sucesso!' : 'Liberação rejeitada.')
      queryClient.invalidateQueries({ queryKey: ['pending_approvals'] })
    }
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando solicitações...</div>

  return (
    <div className="space-y-6 slide-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Liberações Pendentes</h1>
        <p className="text-muted-foreground mt-2">Aprove ou rejeite itens excedentes e itens fora da lista solicitados pelos motoristas.</p>
      </div>

      {approvals.length === 0 ? (
        <div className="glass-card text-center py-16 px-4">
          <Check className="h-12 w-12 mx-auto text-emerald-500/50 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Tudo limpo!</h2>
          <p className="text-muted-foreground">Não há nenhuma solicitação de liberação pendente no momento.</p>
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
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
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
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
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
    </div>
  )
}
