import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, User, MapPin, FileSpreadsheet, Trash2, ChevronRight, AlertTriangle, Search, Plus, Map as MapIcon, ListOrdered } from 'lucide-react'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  waiting: { label: 'Aguardar', variant: 'warning' },
  delivered: { label: 'Entregue', variant: 'success' },
  delivered_with_divergence: { label: 'Entregue (Divergência)', variant: 'warning' },
  canceled: { label: 'Cancelada', variant: 'destructive' },
  returned: { label: 'Retornado', variant: 'destructive' },
}

export default function RouteClients() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, hasPermission } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isImporting, setIsImporting] = useState(false)
  const [sortBy, setSortBy] = useState<'sequence' | 'alphabetical' | 'neighborhood' | 'status'>('sequence')
  const [isGroupedByCity, setIsGroupedByCity] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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
    enabled: isManager 
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

  const updateSequenceMutation = useMutation({
    mutationFn: async ({ clientId, seq }: { clientId: string, seq: number }) => {
      return deliveriesApi.updateDeliveryClient(clientId, { delivery_sequence: seq })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id!] })
    },
    onError: (error: any) => toast.error(`Erro ao salvar sequência: ${error.message}`)
  })

  const handleSequenceChange = (clientId: string, val: string) => {
    const seq = parseInt(val, 10) || 0
    updateSequenceMutation.mutate({ clientId, seq })
  }

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const getCity = (addr?: string | null) => {
    if (!addr) return 'Sem Cidade'
    const parts = addr.split('- ')
    if (parts.length > 1) {
      const p = parts[parts.length - 1].split('/')[0].trim()
      if (p) return p
    }
    // Falha na extração, retornar inteiro ou padrão
    return 'Outras'
  }

  const processedClients = useMemo(() => {
    let filtered = clients
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = clients.filter((c: any) => {
        if (c.name.toLowerCase().includes(term)) return true
        if (c.order_number && String(c.order_number).toLowerCase().includes(term)) return true
        if (c.delivery_items?.some((item: any) => 
          item.description?.toLowerCase().includes(term) || 
          item.product_code?.toLowerCase().includes(term)
        )) return true
        return false
      })
    }

    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortBy === 'sequence') {
        const seqA = a.delivery_sequence || 0
        const seqB = b.delivery_sequence || 0
        if (seqA !== seqB) return seqA - seqB
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'neighborhood') {
        const getNeighborhood = (addr?: string | null) => {
          if (!addr) return ''
          const match = addr.match(/bairro\s+(.*?)(?=\s*-|\s*,|$)/i)
          if (match) return match[1].trim()
          return addr
        }
        return getNeighborhood(a.address).localeCompare(getNeighborhood(b.address)) || a.name.localeCompare(b.name)
      } else if (sortBy === 'status') {
        const order = { pending: 0, waiting: 1, delivered_with_divergence: 2, delivered: 3, canceled: 4, returned: 5 }
        const rankA = order[a.status as keyof typeof order] ?? 99
        const rankB = order[b.status as keyof typeof order] ?? 99
        return rankA - rankB || a.name.localeCompare(b.name)
      }
      return 0
    })

    if (isGroupedByCity) {
      const groups: Record<string, any[]> = {}
      sorted.forEach(c => {
        const city = getCity(c.address)
        if (!groups[city]) groups[city] = []
        groups[city].push(c)
      })
      
      // Ordena as cidades alfabeticamente
      return Object.keys(groups).sort().map(city => ({
        city,
        clients: groups[city]
      }))
    }

    return [{ city: 'Todos', clients: sorted }]
  }, [clients, sortBy, searchTerm, isGroupedByCity])

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
        let currentClientKey = ''

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue
          const rowStr = row.join(' ').trim()
          
          if (rowStr.toLowerCase().includes('pedido de venda')) {
            const match = rowStr.match(/pedido de venda (\d+)/i)
            if (match) currentOrderNumber = match[1]
          }

          const firstCell = row.find(c => c)
          if (typeof firstCell === 'string' && firstCell.trim().startsWith('À ')) {
            currentClientName = firstCell.replace('À ', '').trim()
            currentClientKey = currentOrderNumber ? `${currentClientName}_${currentOrderNumber}` : currentClientName
            
            if (!clientsMap.has(currentClientKey)) {
              clientsMap.set(currentClientKey, {
                name: currentClientName,
                address: '',
                phone: '',
                notes: '',
                order_number: currentOrderNumber || null,
                items: []
              })
            }
            
            if (data[i+1]) {
               const addrRow = data[i+1]
               const addrCell = addrRow.find(c => c)
               if (addrCell && typeof addrCell === 'string' && !addrCell.trim().startsWith('A/C') && !addrCell.trim().startsWith('Telefone')) {
                 clientsMap.get(currentClientKey).address = addrCell.trim()
               }
            }
          }

          if (typeof firstCell === 'string' && firstCell.trim().toLowerCase().startsWith('telefone:')) {
            const phone = firstCell.replace(/telefone:/i, '').trim()
            if (phone && currentClientKey && clientsMap.has(currentClientKey)) {
               clientsMap.get(currentClientKey).phone = phone
            } else if (row.length > 1) { 
               const nextCell = row[1] || row[2]
               if (nextCell && currentClientKey && clientsMap.has(currentClientKey)) {
                 clientsMap.get(currentClientKey).phone = String(nextCell).trim()
               }
            }
          }

          if (typeof firstCell === 'string' && firstCell.trim().toLowerCase() === 'observações') {
             if (data[i+1]) {
               const obsRow = data[i+1]
               const obsCell = obsRow.find(c => c)
               if (obsCell && typeof obsCell === 'string' && currentClientKey && clientsMap.has(currentClientKey)) {
                 const obsText = obsCell.trim()
                 if (obsText && !obsText.toLowerCase().startsWith('atenciosamente')) {
                   const existingNotes = clientsMap.get(currentClientKey).notes
                   clientsMap.get(currentClientKey).notes = existingNotes ? existingNotes + '\nObs: ' + obsText : 'Obs: ' + obsText
                 }
               }
             }
          }

          if (currentClientKey && clientsMap.has(currentClientKey)) {
             const codeCell = row[2]
             const hasRowNumber = (row[0] && /^\d+$/.test(String(row[0]).trim())) || (row[1] && /^\d+$/.test(String(row[1]).trim()))
             
             if (codeCell && hasRowNumber) {
                const strCode = String(codeCell).trim()
                if (strCode.toLowerCase() !== 'código' && strCode.toLowerCase() !== 'codigo' && strCode.length > 0 && strCode.length < 30) {
                   const normalizedCode = normalizeCode(strCode)
                   
                   let foundProduct = null
                   if (normalizedCode.length >= 2) {
                     foundProduct = products.find(prod => {
                       const pCode = normalizeCode(prod.code)
                       const pExt = prod.external_code ? normalizeCode(prod.external_code) : null
                       if (pCode === normalizedCode || pExt === normalizedCode) return true
                       return false
                     })
                   }

                   const descCell = row[4] || row[5] || row[3]
                   let finalDesc = foundProduct ? foundProduct.description : (descCell ? String(descCell).trim() : 'Produto sem descrição')
                   let finalCode = foundProduct ? foundProduct.code : strCode

                   const qtyCell = row[11] || row[10] || row[12]
                   let qty = 1
                   if (qtyCell) {
                      const strQty = String(qtyCell).trim()
                      if (!strQty.includes('/') && !strQty.includes(':')) {
                        const digitsOnly = strQty.replace(/[^\d]/g, '') 
                        const parsed = parseInt(digitsOnly, 10)
                        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) qty = parsed
                      }
                   } 

                   clientsMap.get(currentClientKey).items.push({
                     product_id: foundProduct ? foundProduct.id : null,
                     product_code: finalCode,
                     description: finalDesc,
                     quantity_expected: qty
                   })
                   
                   if (!foundProduct) notFoundCount++
                }
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/entregas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{route?.title || route?.operation?.load_number || 'Rota de Entrega'}</h1>
            {route?.scheduled_date && (
              <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide mt-1">
                Previsão: {new Date(route.scheduled_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {clients.length} clientes • {clients.reduce((sum: number, c: any) => sum + (c.delivery_items?.reduce((itemSum: number, i: any) => itemSum + i.quantity_expected, 0) || 0), 0)} volumes
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full">
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente, pedido ou produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full bg-background/50"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:ml-auto">
            <Button 
              variant={isGroupedByCity ? "default" : "outline"}
              className="gap-2"
              onClick={() => setIsGroupedByCity(!isGroupedByCity)}
            >
              <MapIcon className="h-4 w-4" />
              {isGroupedByCity ? 'Desagrupar Cidades' : 'Agrupar por Cidade'}
            </Button>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex h-10 w-full sm:w-[160px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="sequence">Sequência</option>
              <option value="alphabetical">Alfabética</option>
              <option value="neighborhood">Por Bairro</option>
              <option value="status">Por Status</option>
            </select>

            {isManager && (
              <div className="flex gap-2 w-full sm:w-auto">
                <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button 
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10"
                  onClick={() => navigate(`/entregas/${id}/novo-cliente`)}
                >
                  <Plus className="h-5 w-5" /> Novo Cliente
                </Button>
                <Button 
                  className="gap-2 flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importando...' : <><FileSpreadsheet className="h-5 w-5" /> Importar XLRS</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {clients.length === 0 ? (
          <div className="glass-card text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum cliente cadastrado nesta rota</p>
          </div>
        ) : (
          processedClients.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {isGroupedByCity && (
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">{group.city}</h2>
                  <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground ml-2">
                    {group.clients.length}
                  </span>
                </div>
              )}

              {group.clients.map((client: any, index: number) => {
                const config = statusConfig[client.status] || statusConfig.pending
                const totalItems = client.delivery_items?.length || 0
                const totalVolume = client.delivery_items?.reduce((sum: number, item: any) => sum + item.quantity_expected, 0) || 0

                return (
                  <Card key={client.id} className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all glass-card slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-4 p-4 hover:bg-muted/10 cursor-pointer" onClick={(e) => {
                        // Impedir navegação se clicou no input de sequência
                        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                        navigate(`/entregas/cliente/${client.id}`)
                      }}>
                        
                        {/* Indicador de Sequência Editável */}
                        <div className="flex sm:flex-col items-center sm:justify-center gap-2 mb-3 sm:mb-0 bg-muted/30 p-2 sm:p-3 rounded-lg border border-border/50" onClick={e => e.stopPropagation()}>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                            <ListOrdered className="h-3 w-3" /> Seq.
                          </span>
                          <Input 
                            type="number"
                            defaultValue={client.delivery_sequence || ''}
                            onBlur={(e) => handleSequenceChange(client.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              }
                            }}
                            className="w-16 h-8 text-center font-bold text-lg p-0"
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-foreground text-sm sm:text-base leading-tight">{client.name}</span>
                            <Badge variant={config.variant} className="shrink-0 mt-0.5">{config.label}</Badge>
                          </div>
                          {(client.address || client.phone || client.order_number) && (
                            <div className="flex gap-3 text-sm text-muted-foreground flex-wrap mb-2">
                              {client.order_number && <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-primary font-bold">Pedido: {client.order_number}</span>}
                              {client.address && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 truncate max-w-[200px] hover:text-primary transition-colors hover:underline"
                                  title="Ver no Google Maps"
                                >
                                  <MapPin className="h-3 w-3 shrink-0 text-primary" /> {client.address}
                                </a>
                              )}
                              {client.phone && <span>📞 {client.phone}</span>}
                            </div>
                          )}
                          {client.notes && (
                            <div className="text-xs text-amber-700 bg-amber-500/10 dark:text-amber-400 p-2 rounded mt-1 mb-2 border border-amber-500/20 whitespace-pre-wrap">
                              <span className="font-bold uppercase tracking-wider text-[10px] opacity-70 block mb-0.5">Observação</span>
                              {client.notes.replace('Obs: ', '')}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 bg-muted/20 w-max px-2 py-1 rounded-md">
                            <span className="font-medium text-foreground">{totalItems} <span className="font-normal opacity-70">itens</span></span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="font-medium text-foreground">{totalVolume} <span className="font-normal opacity-70">volumes</span></span>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 hidden sm:block" />
                      </div>

                      {isManager && client.status === 'pending' && (
                        <div className="px-4 pb-3 flex justify-end border-t border-border/30 pt-2 sm:border-none sm:pt-0">
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
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
