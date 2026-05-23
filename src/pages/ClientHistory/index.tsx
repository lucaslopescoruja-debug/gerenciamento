import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Truck, Calendar, CheckCircle2, ChevronDown, ChevronUp, Package, AlertTriangle, FileSignature, Clock, X } from 'lucide-react'

function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return 'Data não registrada'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function formatDateOnly(dateStr: string | undefined) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date)
}

export default function ClientHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['delivery_proofs', searchTerm],
    queryFn: () => deliveriesApi.searchDeliveryProofs(searchTerm),
    enabled: searchTerm.trim().length >= 2,
  })

  const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
    pending: { label: 'Pendente', variant: 'warning' },
    waiting: { label: 'Aguardar', variant: 'warning' },
    delivered: { label: 'Entregue', variant: 'success' },
    delivered_with_divergence: { label: 'Entregue (Divergência)', variant: 'warning' },
    canceled: { label: 'Cancelada', variant: 'destructive' },
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto slide-in pb-20">
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" /> Histórico e Comprovantes
        </h1>
        <p className="text-muted-foreground mt-2">
          Pesquise pelo nome do cliente ou da rota para ver os comprovantes de entrega assinados.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Digite o nome do cliente ou rota (ex: VZ 02123)..." 
          className="pl-10 h-14 text-lg shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && <div className="text-center p-8 text-muted-foreground">Buscando...</div>}

      {!isLoading && searchTerm.length >= 2 && clients.length === 0 && (
        <div className="text-center p-12 glass-card">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-foreground">Nenhum resultado encontrado</p>
          <p className="text-muted-foreground">Tente buscar por um nome diferente.</p>
        </div>
      )}

      {!isLoading && searchTerm.length < 2 && (
        <div className="text-center p-12 glass-card">
          <FileSignature className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Digite pelo menos 2 letras para iniciar a busca.</p>
        </div>
      )}

      <div className="space-y-4">
        {clients.map((client: any) => {
          const isExpanded = expandedId === client.id
          const config = statusConfig[client.status] || statusConfig.pending

          return (
            <Card key={client.id} className="glass-card overflow-hidden transition-all duration-200">
              {/* Header (Clickable) */}
              <div 
                className="p-4 cursor-pointer hover:bg-muted/30 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
                onClick={() => setExpandedId(isExpanded ? null : client.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground truncate">{client.name}</h3>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-0.5 rounded">
                      <Truck className="h-4 w-4 text-primary" /> {client.route?.operation?.load_number || 'Sem rota'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> 
                      {formatDateOnly(client.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {client.address?.split('-')[0]?.trim() || 'Endereço não cadastrado'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-muted-foreground">
                  {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="p-4 pt-0 border-t border-border mt-2 bg-background/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    
                    {/* Lista de Itens */}
                    <div>
                      <h4 className="font-bold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Itens do Pedido ({client.delivery_items?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {client.delivery_items?.map((item: any) => {
                          const isOk = item.quantity_scanned === item.quantity_expected
                          const isExcess = item.quantity_scanned > item.quantity_expected
                          
                          return (
                            <div key={item.id} className="text-sm bg-background border border-border p-2 rounded flex justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground leading-tight">{item.description}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.product_code}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold font-mono">
                                  <span className={isOk ? 'text-emerald-500' : isExcess ? 'text-amber-500' : 'text-blue-500'}>
                                    {item.quantity_scanned}
                                  </span>
                                  <span className="text-muted-foreground text-xs">/{item.quantity_expected}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Comprovante / Assinatura */}
                    <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                      <h4 className="font-bold text-sm uppercase text-muted-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Comprovante de Entrega
                      </h4>
                      
                      {client.status === 'pending' || client.status === 'waiting' ? (
                        <div className="text-center p-6 bg-background rounded-lg border border-dashed border-border">
                          <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">Entrega ainda não finalizada pelo motorista.</p>
                        </div>
                      ) : client.status === 'canceled' ? (
                        <div className="text-center p-6 bg-red-500/5 rounded-lg border border-dashed border-red-500/20">
                          <X className="h-8 w-8 mx-auto text-red-500/50 mb-2" />
                          <p className="text-sm text-red-500 font-bold">Entrega Cancelada</p>
                        </div>
                      ) : !client.signature_data ? (
                        <div className="text-center p-6 bg-amber-500/5 rounded-lg border border-dashed border-amber-500/20">
                          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500/50 mb-2" />
                          <p className="text-sm text-amber-500 font-bold">Sem Assinatura</p>
                          <p className="text-xs text-muted-foreground mt-1">A entrega foi finalizada mas o motorista não coletou assinatura.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-2 border border-border relative overflow-hidden">
                            <div className="absolute top-2 left-2 text-[10px] uppercase font-bold text-black/30">Assinatura Digital</div>
                            <img 
                              src={client.signature_data} 
                              alt="Assinatura" 
                              className="w-full h-auto max-h-48 object-contain mix-blend-multiply"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 bg-background p-3 rounded-lg border border-border">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Recebedor</p>
                              <p className="font-medium text-sm text-foreground">{client.receiver_name || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Documento (RG/CPF)</p>
                              <p className="font-medium text-sm font-mono text-foreground">{client.receiver_doc || 'Não informado'}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-border mt-1">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Data/Hora da Assinatura</p>
                              <p className="font-medium text-xs text-foreground">
                                {formatDateTime(client.signed_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
