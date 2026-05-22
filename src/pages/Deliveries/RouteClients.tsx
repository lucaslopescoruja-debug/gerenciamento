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

        const clientsMap = new Map<string, any>()
        let notFoundCount = 0
        let currentClientName = ''
        let currentOrderNumber = ''

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue

          const rowStr = row.join(' ').trim()
          
          // Check for Order Number
          if (rowStr.toLowerCase().includes('pedido de venda')) {
            const match = rowStr.match(/pedido de venda (\d+)/i)
            if (match) {
              currentOrderNumber = match[1]
            }
          }

          // Check for Client Name
          const firstCell = row.find(c => c)
          if (typeof firstCell === 'string' && firstCell.trim().startsWith('À ')) {
            currentClientName = firstCell.replace('À ', '').trim()
            if (!clientsMap.has(currentClientName)) {
              clientsMap.set(currentClientName, {
                name: currentClientName,
                address: '',
                phone: '',
                notes: currentOrderNumber ? `Pedido: ${currentOrderNumber}` : '',
                items: []
              })
            }
            
            // Extract address (usually next line)
            if (data[i+1]) {
               const addrRow = data[i+1]
               const addrCell = addrRow.find(c => c)
               if (addrCell && typeof addrCell === 'string' && !addrCell.trim().startsWith('A/C') && !addrCell.trim().startsWith('Telefone')) {
                 clientsMap.get(currentClientName).address = addrCell.trim()
               }
            }
          }

          // Check for Phone
          if (typeof firstCell === 'string' && firstCell.trim().toLowerCase().startsWith('telefone:')) {
            const phone = firstCell.replace(/telefone:/i, '').trim()
            if (phone && currentClientName && clientsMap.has(currentClientName)) {
               clientsMap.get(currentClientName).phone = phone
            } else if (row.length > 1) { 
               const nextCell = row[1] || row[2]
               if (nextCell && currentClientName && clientsMap.has(currentClientName)) {
                 clientsMap.get(currentClientName).phone = String(nextCell).trim()
               }
            }
          }

          // Check for Products
          if (currentClientName && clientsMap.has(currentClientName)) {
             let foundProduct = null
             let qty = 0

             for (const cell of row) {
               if (!cell) continue
               const strCell = String(cell).trim()
               const normalizedCell = normalizeCode(strCell)
               
               // Look for product in DB
               if (!foundProduct && normalizedCell.length >= 3) {
                 const p = products.find(prod => normalizeCode(prod.code) === normalizedCell || (prod.external_code && normalizeCode(prod.external_code) === normalizedCell))
                 if (p) foundProduct = p
               }

               // Look for quantity
               if (strCell.toLowerCase().includes('un') || strCell.toLowerCase().includes('cx') || strCell.toLowerCase().includes('kg')) {
                 const parsed = parseInt(strCell)
                 if (!isNaN(parsed) && parsed > 0) qty = parsed
               }
             }
             
             if (foundProduct) {
               // Fallback quantity search if not found
               if (qty === 0) {
                  for (let j = row.length - 1; j >= 0; j--) {
                     if (row[j]) {
                        const parsed = parseInt(String(row[j]))
                        if (!isNaN(parsed) && parsed > 0 && String(row[j]).trim() !== foundProduct.code) {
                           qty = parsed
                           break
                        }
                     }
                  }
               }
               
               // Add item
               clientsMap.get(currentClientName).items.push({
                 product_id: foundProduct.id,
                 product_code: foundProduct.code,
                 description: foundProduct.description,
                 quantity_expected: qty > 0 ? qty : 1
               })
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
