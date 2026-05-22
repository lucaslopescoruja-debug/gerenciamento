import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, User, MapPin, Upload, FileSpreadsheet, Trash2, ChevronRight, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  waiting: { label: 'Aguardar', variant: 'warning' },
  delivered: { label: 'Entregue', variant: 'success' },
  delivered_with_divergence: { label: 'Entregue (Divergência)', variant: 'warning' },
  canceled: { label: 'Cancelada', variant: 'destructive' },
}

export default function RouteClients() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isImporting, setIsImporting] = useState(false)

  const { data: route, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['delivery_route', id],
    queryFn: () => deliveriesApi.getDeliveryRoute(id!),
    enabled: !!id,
  })

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['delivery_clients', id],
    queryFn: () => deliveriesApi.getDeliveryClients(id!),
    enabled: !!id,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
    enabled: isManager // we only need products for parsing excel
  })

  const importMutation = useMutation({
    mutationFn: (clientsData: any[]) => deliveriesApi.importDeliveryClients(id!, clientsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id] })
      toast.success('Clientes importados com sucesso!')
      setIsImporting(false)
    },
    onError: (error: any) => {
      toast.error(`Erro ao importar: ${error.message}`)
      setIsImporting(false)
    }
  })

  const deleteClientMutation = useMutation({
    mutationFn: deliveriesApi.deleteDeliveryClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id] })
      toast.success('Cliente removido')
    },
    onError: (error: any) => toast.error(`Erro ao remover: ${error.message}`)
  })

  // Helper to strip non-alphanumeric characters
  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][]

        // Expected Columns: 0:Cliente, 1:Endereço, 2:Telefone, 3:Observação, 4:Código Produto, 5:Quantidade
        const clientsMap = new Map<string, any>()
        let notFoundCount = 0

        for (let i = 1; i < data.length; i++) { // skip header
          const row = data[i]
          if (!row || row.length === 0 || !row[0]) continue

          const clientName = String(row[0]).trim()
          if (!clientName) continue

          const address = row[1] ? String(row[1]).trim() : ''
          const phone = row[2] ? String(row[2]).trim() : ''
          const notes = row[3] ? String(row[3]).trim() : ''
          const productCode = row[4] ? String(row[4]).trim() : ''
          const qty = row[5] ? parseInt(String(row[5])) : 0

          if (!clientsMap.has(clientName)) {
            clientsMap.set(clientName, {
              name: clientName, address, phone, notes, items: []
            })
          }

          if (productCode && qty > 0) {
            const normalizedImportCode = normalizeCode(productCode)
            const product = products.find(p => normalizeCode(p.code) === normalizedImportCode || (p.external_code && normalizeCode(p.external_code) === normalizedImportCode))
            
            if (product) {
              clientsMap.get(clientName).items.push({
                product_id: product.id,
                product_code: product.code,
                description: product.description,
                quantity_expected: qty
              })
            } else {
              notFoundCount++
            }
          }
        }

        const clientsData = Array.from(clientsMap.values())
        if (clientsData.length === 0) {
          toast.error('Nenhum dado válido encontrado na planilha.')
          setIsImporting(false)
          return
        }

        if (notFoundCount > 0) {
          toast.warning(`${notFoundCount} produtos não foram encontrados no banco de dados.`)
        }

        importMutation.mutate(clientsData)
      } catch (err) {
        toast.error('Erro ao ler a planilha.')
        setIsImporting(false)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsBinaryString(file)
  }

  if (isLoadingRoute || isLoadingClients) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/entregas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">{route?.operation?.load_number || 'Rota de Entrega'}</h1>
            <p className="text-sm text-muted-foreground mt-1">Clientes e Pedidos da Rota</p>
          </div>
        </div>
        {isManager && (
          <div>
            <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <Button 
              className="gap-2 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'Importando...' : <><FileSpreadsheet className="h-5 w-5" /> Importar XLRS</>}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {clients.length === 0 ? (
          <div className="glass-card text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum cliente cadastrado nesta rota</p>
            {isManager && <p className="text-sm text-muted-foreground mt-2">Clique em Importar XLRS para carregar os clientes e seus pedidos.</p>}
          </div>
        ) : (
          clients.map((client: any, index: number) => {
            const config = statusConfig[client.status] || statusConfig.pending
            return (
              <Card key={client.id} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all glass-card slide-up" style={{ animationDelay: `${index * 60}ms` }}>
                <CardContent className="p-0">
                  <Link to={`/entregas/cliente/${client.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/10 cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-base truncate">{client.name}</span>
                        <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
                      </div>
                      {(client.address || client.phone) && (
                        <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                          {client.address && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="h-3 w-3 shrink-0" /> {client.address}</span>}
                          {client.phone && <span>📞 {client.phone}</span>}
                        </div>
                      )}
                      {client.status === 'delivered_with_divergence' && (
                        <div className="text-amber-500 text-xs mt-1 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Divergência reportada
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                  </Link>

                  {isManager && client.status === 'pending' && (
                    <div className="px-4 pb-3 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8"
                        onClick={(e) => {
                          e.preventDefault()
                          if (window.confirm('Tem certeza que deseja apagar este cliente da rota?')) {
                            deleteClientMutation.mutate(client.id)
                          }
                        }}
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Apagar Cliente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
