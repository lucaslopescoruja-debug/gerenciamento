import { useState, useRef, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, User, MapPin, FileSpreadsheet, Trash2, ChevronRight, AlertTriangle, Search, Plus, Map as MapIcon, ListOrdered, Menu, FileDown, CheckSquare, Truck, DownloadCloud, GitMerge } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as XLSX from 'xlsx'
import { geocodeAddress, optimizeRoute } from '@/api/routing'
import { equipmentsApi } from '@/api/equipments'
import { ExecutionModal } from '@/pages/Comodatos/ExecutionModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { generateRouteReportPDF } from '@/utils/pdf'
import { supabase } from '@/lib/supabase'
import { OfflineSyncService } from '@/services/OfflineSyncService'
const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  pendente: { label: 'Pendente', variant: 'warning' },
  waiting: { label: 'Aguardar', variant: 'warning' },
  em_rota: { label: 'Em Rota', variant: 'warning' },
  delivered: { label: 'Entregue', variant: 'success' },
  concluido: { label: 'Concluído', variant: 'success' },
  delivered_with_divergence: { label: 'Entregue (Divergência)', variant: 'warning' },
  canceled: { label: 'Cancelada', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  returned: { label: 'Retornado', variant: 'destructive' },
}

export default function RouteClients() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, hasPermission, company } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isImporting, setIsImporting] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationStatus, setOptimizationStatus] = useState('')
  const [sortBy, setSortBy] = useState<'sequence' | 'alphabetical' | 'neighborhood' | 'status'>('sequence')
  const [isGroupedByCity, setIsGroupedByCity] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [selectedOsToExecute, setSelectedOsToExecute] = useState<any>(null)
  const [isAddOsModalOpen, setIsAddOsModalOpen] = useState(false)
  const [osSearchTerm, setOsSearchTerm] = useState('')

  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [selectedSourceRouteId, setSelectedSourceRouteId] = useState('')
  const [isMerging, setIsMerging] = useState(false)

  const { data: otherRoutes = [] } = useQuery({
    queryKey: ['delivery_routes'],
    queryFn: deliveriesApi.getDeliveryRoutes,
    select: (data) => data.filter((r: any) => r.id !== id && (r.status === 'pending' || r.status === 'in_progress'))
  })

  // Checklist states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false)
  const [checklistType, setChecklistType] = useState<'initial' | 'final'>('initial')
  const [checklistKm, setChecklistKm] = useState('')
  const [checklistTemp, setChecklistTemp] = useState('')

  const { data: checklist, isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['vehicle_checklist', id],
    queryFn: async () => {
      if (!navigator.onLine) {
        // Fallback to local DB check
        const { default: db } = await import('@/db/db')
        const route = await db.routes.get(id!)
        if (route && (route as any).initial_km) {
           return {
             initial_km: (route as any).initial_km,
             final_km: (route as any).final_km,
           }
        }
        return null
      }
      const { data } = await supabase.from('vehicle_checklists').select('*').eq('route_id', id).maybeSingle()
      return data || null
    },
    enabled: !!id,
  })

  const saveChecklistMutation = useMutation({
    mutationFn: async ({ km, temp, type }: { km: number, temp?: number, type: 'initial' | 'final' }) => {
      if (!navigator.onLine) {
        const { default: db } = await import('@/db/db')
        const updateData: any = type === 'initial' ? { initial_km: km } : { final_km: km }
        await db.routes.update(id!, updateData)
        
        await db.sync_queue.add({
          type: type === 'initial' ? 'CONFIRM_ROUTE_CHECKLIST_INITIAL' : 'CONFIRM_ROUTE_CHECKLIST_FINAL',
          payload: { route_id: id, km, temp, driver_id: user?.id },
          created_at: Date.now(),
          status: 'pending'
        })
        return
      }

      if (type === 'initial') {
        const { error } = await supabase.from('vehicle_checklists').insert({
          route_id: id,
          driver_id: user?.id,
          initial_km: km,
          initial_temp: temp || null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('vehicle_checklists').update({
          final_km: km,
          final_temp: temp || null,
          final_checked_at: new Date().toISOString()
        }).eq('route_id', id)
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_checklist', id] })
      toast.success(variables.type === 'initial' ? 'Checklist Inicial salvo! Rota liberada.' : 'Checklist Final salvo! Rota encerrada.')
      setIsChecklistModalOpen(false)
      setChecklistKm('')
      setChecklistTemp('')
    },
    onError: (error: any) => toast.error(`Erro ao salvar checklist: ${error.message}`)
  })

  const { data: route, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['delivery_route', id],
    queryFn: () => deliveriesApi.getDeliveryRoute(id!),
    enabled: !!id,
  })

  const { data: routeOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['route_orders', id],
    queryFn: () => equipmentsApi.getRouteOrders(id!),
    enabled: !!id,
  })

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['delivery_clients', id],
    queryFn: () => deliveriesApi.getDeliveryClients(id!),
    enabled: !!id,
  })

  // Sync data to local Dexie DB when loaded and online
  useEffect(() => {
    if (route && clients && clients.length > 0 && navigator.onLine) {
      OfflineSyncService.syncRouteData(route, clients, routeOrders)
    }
  }, [route, clients, routeOrders])

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
    enabled: isManager 
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
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
    mutationFn: async ({ stopId, seq, type }: { stopId: string, seq: number, type: 'client' | 'os' }) => {
      if (type === 'client') {
        return deliveriesApi.updateDeliveryClient(stopId, { delivery_sequence: seq })
      } else {
        return equipmentsApi.updateOrder(stopId, { delivery_sequence: seq })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id!] })
      queryClient.invalidateQueries({ queryKey: ['route_orders', id!] })
    },
    onError: (error: any) => toast.error(`Erro ao salvar sequência: ${error.message}`)
  })

  const handleSequenceChange = (stopId: string, val: string, type: 'client' | 'os') => {
    const seq = parseInt(val, 10) || 0
    updateSequenceMutation.mutate({ stopId, seq, type })
  }

  const removeOsMutation = useMutation({
    mutationFn: async (osId: string) => {
      return equipmentsApi.updateOrder(osId, { delivery_route_id: null, delivery_sequence: 0 })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route_orders', id!] })
      toast.success('OS removida da rota')
    },
    onError: (error: any) => toast.error(`Erro ao remover OS: ${error.message}`)
  })



  const optimizeMutation = useMutation({
    mutationFn: async () => {
      setIsOptimizing(true)
      try {
        if (!company?.garage_address && (!company?.garage_lat || !company?.garage_lng)) {
          throw new Error('Endereço da garagem não configurado. Vá em "Minha Empresa" para configurar.')
        }
        
        let garageCoord: {lat: number, lng: number} | null = null;
        if (company.garage_lat && company.garage_lng) {
           const glat = Number(String(company.garage_lat).replace(',', '.'));
           const glng = Number(String(company.garage_lng).replace(',', '.'));
           if (!isNaN(glat) && !isNaN(glng)) {
             garageCoord = { lat: glat, lng: glng };
           }
        }
        
        if (!garageCoord && company.garage_address) {
           setOptimizationStatus('Geocodificando garagem...')
           garageCoord = await geocodeAddress(company.garage_address)
        }

        if (!garageCoord) throw new Error('Não foi possível encontrar as coordenadas da garagem.')

        const clientsWithCoords = []
        let idx = 1
        
        // Optimize both clients and OS
        const allStops = [
          ...clients.map((c: any) => ({ ...c, stopType: 'client' })),
          ...routeOrders.map((o: any) => ({ ...o, stopType: 'os', address: o.customer?.address ? `${o.customer.address}, ${o.customer.number || ''}` : '', latitude: o.customer?.latitude, longitude: o.customer?.longitude }))
        ]

        for (const c of allStops) {
          let lat = c.latitude || c.customer?.latitude;
          let lng = c.longitude || c.customer?.longitude;
          
          if (!lat || !lng) {
             const docStr = c.customer?.document ? c.customer.document.replace(/[^\d]/g, '') : null;
             const foundCustomer = customers.find((cust: any) => 
               (docStr && cust.document && cust.document.replace(/[^\d]/g, '') === docStr) ||
               (cust.nickname && c.name && cust.nickname.toLowerCase().includes(c.name.toLowerCase())) ||
               (cust.legal_name && c.name && cust.legal_name.toLowerCase().includes(c.name.toLowerCase())) ||
               (c.name && cust.nickname && c.name.toLowerCase().includes(cust.nickname.toLowerCase()))
             );
             if (foundCustomer && foundCustomer.latitude && foundCustomer.longitude) {
               lat = foundCustomer.latitude;
               lng = foundCustomer.longitude;
             }
          }

          if (lat && lng) {
            const numLat = Number(String(lat).replace(',', '.'));
            const numLng = Number(String(lng).replace(',', '.'));
            if (!isNaN(numLat) && !isNaN(numLng)) {
              clientsWithCoords.push({ id: `${c.stopType}_${c.id}`, coord: { lat: numLat, lng: numLng } })
            }
          } else if (c.address) {
            setOptimizationStatus(`Buscando coordenadas ${idx}/${allStops.length}...`)
            const coord = await geocodeAddress(c.address)
            if (coord && !isNaN(coord.lat) && !isNaN(coord.lng)) {
              clientsWithCoords.push({ id: `${c.stopType}_${c.id}`, coord })
            }
          }
          idx++
        }

        if (clientsWithCoords.length === 0) throw new Error('Nenhum endereço válido encontrado para otimizar.')

        setOptimizationStatus('Calculando melhor rota (OSRM)...')
        const optimizedSequence = await optimizeRoute(garageCoord, clientsWithCoords)

        setOptimizationStatus('Salvando nova ordem...')
        // Update all sequences in parallel
        await Promise.all(
          optimizedSequence.map(item => {
            const [type, idStr] = item.clientId.split('_');
            if (type === 'client') {
              return deliveriesApi.updateDeliveryClient(idStr, { delivery_sequence: item.sequence });
            } else {
              return equipmentsApi.updateOrder(idStr, { delivery_sequence: item.sequence });
            }
          })
        )
      } finally {
        setIsOptimizing(false)
        setOptimizationStatus('')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id!] })
      setSortBy('sequence') // Force sort by sequence to see result
      toast.success('Rota otimizada com sucesso!')
    },
    onError: (error: any) => toast.error(`Erro ao otimizar rota: ${error.message}`)
  })

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

  const processedStops = useMemo(() => {
    const stops = [
      ...clients.map((c: any) => ({ type: 'client' as const, id: c.id, name: c.name || '', address: c.address || '', status: c.status, delivery_sequence: c.delivery_sequence, data: c })),
      ...routeOrders.map((o: any) => ({ type: 'os' as const, id: o.id, name: o.customer?.legal_name || o.customer?.fantasy_name || 'OS sem cliente', address: o.customer?.address ? `${o.customer.address}, ${o.customer.number || ''}` : '', status: o.status, delivery_sequence: o.delivery_sequence, data: o }))
    ]

    let filtered = stops
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = stops.filter((s: any) => {
        if (s.name.toLowerCase().includes(term)) return true
        if (s.type === 'client') {
          if (s.data.order_number && String(s.data.order_number).toLowerCase().includes(term)) return true
          if (s.data.delivery_items?.some((item: any) => 
            item.description?.toLowerCase().includes(term) || 
            item.product_code?.toLowerCase().includes(term)
          )) return true
        } else {
          if (s.data.os_number && String(s.data.os_number).toLowerCase().includes(term)) return true
        }
        return false
      })
    }

    const sorted = [...filtered].sort((a: any, b: any) => {
      // Pedidos finalizados vão para o final da lista
      const isFinished = (status: string) => ['delivered', 'delivered_with_divergence', 'canceled', 'returned', 'concluido'].includes(status)
      const aFinished = isFinished(a.status)
      const bFinished = isFinished(b.status)
      
      if (aFinished && !bFinished) return 1
      if (!aFinished && bFinished) return -1

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
        const order = { pending: 0, pendente: 0, em_rota: 1, waiting: 1, delivered_with_divergence: 2, delivered: 3, concluido: 3, canceled: 4, cancelado: 4, returned: 5 }
        const rankA = order[a.status as keyof typeof order] ?? 99
        const rankB = order[b.status as keyof typeof order] ?? 99
        return rankA - rankB || a.name.localeCompare(b.name)
      }
      return 0
    })

    if (isGroupedByCity) {
      const groups: Record<string, any[]> = {}
      sorted.forEach(s => {
        const city = getCity(s.address)
        if (!groups[city]) groups[city] = []
        groups[city].push(s)
      })
      
      return Object.keys(groups).sort().map(city => ({
        city,
        stops: groups[city]
      }))
    }

    return [{ city: 'Todos', stops: sorted }]
  }, [clients, routeOrders, sortBy, searchTerm, isGroupedByCity])

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
        let clientsNotFoundInBase = 0
        let currentClientName = ''
        let currentOrderNumber = ''
        let currentClientKey = ''

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue
          const rowStr = row.join(' ').trim()
          
          const col1 = typeof row[0] === 'string' ? row[0].trim() : ''
          const col2 = typeof row[1] === 'string' ? row[1].trim() : ''
          const col3 = typeof row[2] === 'string' ? row[2].trim() : ''

          // ==== TEMPLATE ESTOQUE FACIL ====
          if (col1.includes('Numero de pedido') || col2.includes('Numero de pedido')) {
             currentOrderNumber = (col1.includes('Numero de pedido') ? col2 : col3).replace(/[^\d]/g, '')
          }
          if (col1.includes('Razao Social') || col2.includes('Razao Social')) {
             const rawName = col1.includes('Razao Social') ? col2 : col3
             currentClientName = rawName.replace(/[()]/g, '').trim()
             currentClientKey = currentOrderNumber ? `${currentClientName}_${currentOrderNumber}` : currentClientName
             
             if (!clientsMap.has(currentClientKey)) {
                clientsMap.set(currentClientKey, {
                  name: currentClientName,
                  customer_id: null,
                  document: '',
                  address: '',
                  phone: '',
                  notes: '',
                  order_number: currentOrderNumber || null,
                  items: []
                })
             }
          }
          if (col1.includes('CNPJ') || col2.includes('CNPJ') || col1.includes('CPF') || col2.includes('CPF')) {
             if (currentClientKey && clientsMap.has(currentClientKey)) {
                clientsMap.get(currentClientKey).document = String((col1.includes('CNPJ') || col1.includes('CPF')) ? col2 : col3).replace(/[^\d]/g, '')
             }
          }
          if (col1 === 'Endereço' || col2 === 'Endereço') {
             if (currentClientKey && clientsMap.has(currentClientKey)) {
                clientsMap.get(currentClientKey).address = String(col1 === 'Endereço' ? col2 : col3).trim()
             }
          }

          // ==== TEMPLATE ANTIGO ====
          if (rowStr.toLowerCase().includes('pedido de venda')) {
            const match = rowStr.match(/pedido de venda (\d+)/i)
            if (match) currentOrderNumber = match[1]
          }

          const firstCell = row.find(c => c)
          if (typeof firstCell === 'string' && firstCell.trim().startsWith('À ')) {
            let clientFullName = firstCell.replace('À ', '').trim()
            let doc = ''
            const docMatch = clientFullName.match(/[-–]\s*([\d.\-\/]+)$/)
            if (docMatch) {
               doc = docMatch[1].replace(/[^\d]/g, '')
               clientFullName = clientFullName.replace(docMatch[0], '').trim()
            }

            currentClientName = clientFullName
            currentClientKey = currentOrderNumber ? `${currentClientName}_${currentOrderNumber}` : currentClientName
            
            if (!clientsMap.has(currentClientKey)) {
              clientsMap.set(currentClientKey, {
                name: currentClientName,
                customer_id: null,
                document: doc,
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

          if (typeof firstCell === 'string' && (firstCell.trim().toLowerCase().includes('cnpj:') || firstCell.trim().toLowerCase().includes('cpf:'))) {
            // Só se o parser de template antigo passar por aqui
            const doc = firstCell.replace(/cnpj\/cpf:|cnpj:|cpf:/i, '').replace(/[^\d]/g, '').trim()
            if (doc && currentClientKey && clientsMap.has(currentClientKey)) {
               clientsMap.get(currentClientKey).document = doc
            }
          }

          // Observações comum a ambos os templates
          if (typeof firstCell === 'string' && (firstCell.trim().toLowerCase() === 'observações' || firstCell.trim().toLowerCase() === 'observações:')) {
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

          // ITEMS (Comum aos dois templates, com desvios condicionais)
          if (currentClientKey && clientsMap.has(currentClientKey)) {
             const codeCell = row[2]
             const hasRowNumber = (row[0] && /^\d+$/.test(String(row[0]).trim())) || (row[1] && /^\d+$/.test(String(row[1]).trim()))
             const hasQuantity = !!(row[4] || row[11] || row[10] || row[12])
             
             if (codeCell && (hasRowNumber || hasQuantity)) {
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

                   // Decide based on whether row[11] exists
                   let descCell = row[5] || row[4] || row[3]
                   let qtyCell = row[11] || row[10] || row[12]
                   
                   if (row[11] === undefined && row[10] === undefined && row[12] === undefined) {
                     // Probably EstoqueFacil
                     descCell = row[3]
                     qtyCell = row[4]
                   }

                   let finalDesc = foundProduct ? foundProduct.description : (descCell ? String(descCell).trim() : 'Produto sem descrição')
                   let finalCode = foundProduct ? foundProduct.code : strCode

                   let qty = 1
                   if (qtyCell) {
                      let strQty = String(qtyCell).trim()
                      if (!strQty.includes('/') && !strQty.includes(':')) {
                        strQty = strQty.replace(',', '.')
                        // Extract numeric part (including dots)
                        const numericPartMatch = strQty.match(/[\d.]+/)
                        if (numericPartMatch) {
                           const parsed = parseFloat(numericPartMatch[0])
                           if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
                              qty = Math.round(parsed) // Round to nearest integer (quantities are usually integer)
                           }
                        }
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

        const clientsData = Array.from(clientsMap.values()).map((client: any) => {
          if (client.document) {
            const found = customers.find(c => (c.document || '').replace(/[^\d]/g, '') === client.document)
            if (found) {
              client.customer_id = found.id
              // Substitui os dados da planilha pelos do sistema se houver
              client.name = found.nickname || found.legal_name || client.name
              if (found.address) {
                client.address = `${found.address}, ${found.number || ''}, ${found.neighborhood || ''}, ${found.city || ''} - ${found.state || ''}`.replace(/,\s*,/g, ',').trim()
              }
              client.phone = found.phone1 || found.phone2 || client.phone
            } else {
              client.notes = client.notes ? client.notes + '\nObs: Cliente não localizado na base' : 'Obs: Cliente não localizado na base'
              clientsNotFoundInBase++
            }
          } else {
            // Se nem tinha documento no arquivo para procurar
            client.notes = client.notes ? client.notes + '\nObs: Cliente não localizado na base (Sem documento)' : 'Obs: Cliente não localizado na base (Sem documento)'
            clientsNotFoundInBase++
          }
          return client
        })

        if (clientsData.length === 0) {
          toast.error('Nenhum dado válido encontrado na planilha.')
          setIsImporting(false)
          return
        }

        if (notFoundCount > 0) {
          toast.warning(`${notFoundCount} produtos não foram encontrados no banco de dados.`)
        }
        if (clientsNotFoundInBase > 0) {
          toast.warning(`${clientsNotFoundInBase} clientes não foram localizados na base de dados (Sem vínculo de CPF/CNPJ).`)
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

  const isInitialChecklistDone = !!checklist?.initial_km || (route?.status && route.status !== 'pending') || processedStops.some((g: any) => g.stops.some((s: any) => ['em_rota', 'delivered', 'delivered_with_divergence', 'concluido'].includes(s.status)))

  const handleMerge = async () => {
    if (!selectedSourceRouteId) {
      toast.error('Selecione uma rota para mesclar')
      return
    }

    const sourceRoute = otherRoutes.find((r: any) => r.id === selectedSourceRouteId)
    const sourceName = sourceRoute?.title || sourceRoute?.operation?.load_number || 'Rota Origem'
    const currentName = route?.title || route?.operation?.load_number || 'Esta Rota'

    const confirmText = `Deseja realmente trazer todos os clientes e itens da rota "${sourceName}" para esta rota ("${currentName}")?\n\nA rota "${sourceName}" será excluída e seus clientes serão adicionados aqui.`
    
    if (!window.confirm(confirmText)) {
      return
    }

    setIsMerging(true)
    try {
      // 1. Move delivery_clients to this route
      const { error: errMoveClients } = await supabase
        .from('delivery_clients')
        .update({ delivery_route_id: id })
        .eq('delivery_route_id', selectedSourceRouteId)

      if (errMoveClients) throw errMoveClients

      // 2. Move equipment_orders to this route
      const { error: errMoveEquip } = await supabase
        .from('equipment_orders')
        .update({ delivery_route_id: id })
        .eq('delivery_route_id', selectedSourceRouteId)

      if (errMoveEquip) throw errMoveEquip

      // 3. Merge operation_items
      const targetOpId = route.operation_id
      const sourceOpId = sourceRoute.operation_id

      if (targetOpId && sourceOpId) {
        const { data: targetItems } = await supabase
          .from('operation_items')
          .select('*')
          .eq('operation_id', targetOpId)

        const { data: sourceItems } = await supabase
          .from('operation_items')
          .select('*')
          .eq('operation_id', sourceOpId)

        const targetItemsMap = new Map<string, any>((targetItems || []).map(i => [i.product_code || i.product_id, i]))

        for (const sourceItem of (sourceItems || [])) {
          const key = sourceItem.product_code || sourceItem.product_id
          const targetItem = targetItemsMap.get(key)

          if (targetItem) {
            const newExpected = targetItem.quantity_expected + sourceItem.quantity_expected
            const newScanned = (targetItem.quantity_scanned || 0) + (sourceItem.quantity_scanned || 0)
            const newStatus = newScanned >= newExpected ? 'ok' : 'pending'

            const { error: errUpdateTarget } = await supabase
              .from('operation_items')
              .update({
                quantity_expected: newExpected,
                quantity_scanned: newScanned,
                status: newStatus
              })
              .eq('id', targetItem.id)

            if (errUpdateTarget) throw errUpdateTarget

            const { error: errDeleteSource } = await supabase
              .from('operation_items')
              .delete()
              .eq('id', sourceItem.id)

            if (errDeleteSource) throw errDeleteSource
          } else {
            const { error: errAssignSource } = await supabase
              .from('operation_items')
              .update({ operation_id: targetOpId })
              .eq('id', sourceItem.id)

            if (errAssignSource) throw errAssignSource
          }
        }
      }

      // 4. Concatenate notes on operations
      if (targetOpId && sourceOpId) {
        const { data: opsData } = await supabase
          .from('operations')
          .select('id, load_number, notes')
          .in('id', [targetOpId, sourceOpId])

        if (opsData) {
          const targetOp = opsData.find(o => o.id === targetOpId)
          const sourceOp = opsData.find(o => o.id === sourceOpId)

          const nextNotes = `${targetOp?.notes || ''}\n[Mesclado com Rota/Carga: ${sourceOp?.load_number || ''}]`.trim()
          await supabase
            .from('operations')
            .update({ notes: nextNotes })
            .eq('id', targetOpId)
        }
      }

      // 5. Delete source route
      const { error: errDeleteRoute } = await supabase
        .from('delivery_routes')
        .delete()
        .eq('id', selectedSourceRouteId)

      if (errDeleteRoute) throw errDeleteRoute

      // 6. Delete source operation
      if (sourceOpId) {
        const { error: errDeleteOp } = await supabase
          .from('operations')
          .delete()
          .eq('id', sourceOpId)

        if (errDeleteOp) throw errDeleteOp
      }

      // 7. Recalculate target route status
      await deliveriesApi.recalculateRouteStatus(id!)

      toast.success('Rotas mescladas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_route', id] })
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', id] })
      queryClient.invalidateQueries({ queryKey: ['route_orders', id] })
      setIsMergeDialogOpen(false)
      setSelectedSourceRouteId('')
    } catch (err: any) {
      console.error(err)
      toast.error(`Erro ao mesclar rotas: ${err.message || err}`)
    } finally {
      setIsMerging(false)
    }
  }

  if (isLoadingRoute || isLoadingClients) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/entregas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{route?.title || route?.operation?.load_number || 'Rota de Entrega'}</h1>
              {route?.scheduled_date && (
                <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide mt-1">
                  Previsão: {new Date(route.scheduled_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {processedStops.reduce((sum: number, group: any) => sum + group.stops.length, 0)} paradas
              </p>
            </div>

            {isManager && (route?.status === 'completed' || route?.status === 'concluido' || route?.status === 'returned') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                onClick={() => {
                  toast.info('Gerando PDF...', { duration: 3000 });
                  generateRouteReportPDF(route, clients, routeOrders, company, true, checklist).catch(err => {
                    console.error(err);
                    toast.error('Erro ao gerar relatório com comprovantes.');
                  });
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Imprimir Comprovantes</span>
                <span className="sm:hidden">Comprovantes</span>
              </Button>
            )}
          </div>
        </div>

        {/* Botoes de Checklist */}
        {!isLoadingChecklist && (
          <div className="w-full flex flex-col gap-2 bg-muted/20 p-4 rounded-lg border border-border/50">
            {!isInitialChecklistDone ? (
              <>
                <p className="text-sm text-amber-600 font-semibold mb-1">Você precisa realizar o Checklist Inicial para iniciar as entregas.</p>
                <Button 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-12"
                  onClick={async () => {
                    if (navigator.onLine) {
                      toast.info('Sincronizando rota para o modo offline...', { duration: 2000 })
                      try {
                        const { OfflineSyncService } = await import('@/services/OfflineSyncService')
                        await OfflineSyncService.syncRouteData(route, clients, routeOrders)
                      } catch (error) {
                        console.error('Error syncing route:', error)
                      }
                    }
                    setChecklistType('initial')
                    setIsChecklistModalOpen(true)
                  }}
                >
                  <CheckSquare className="w-5 h-5 mr-2" /> Preencher Checklist Inicial
                </Button>
              </>
            ) : !checklist?.final_km && processedStops.every(g => g.stops.every(s => ['delivered', 'delivered_with_divergence', 'canceled', 'returned', 'concluido'].includes(s.status))) ? (
              <>
                <p className="text-sm text-green-600 font-semibold mb-1">Todas as paradas foram concluídas! Retorne à base e finalize a rota.</p>
                <Button 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold h-12"
                  onClick={() => {
                    setChecklistType('final')
                    setIsChecklistModalOpen(true)
                  }}
                >
                  <CheckSquare className="w-5 h-5 mr-2" /> Preencher Checklist Final
                </Button>
              </>
            ) : checklist?.final_km ? (
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-green-50 rounded-lg">
                 <div className="flex items-center gap-2 text-green-600 font-bold">
                   <CheckSquare className="w-5 h-5" /> Rota Encerrada (Checklist Finalizado)
                 </div>
                 <Button 
                    variant="outline"
                    className="border-green-600/50 text-green-700 hover:bg-green-100 bg-white/50"
                    onClick={async () => {
                      if (navigator.onLine) {
                        toast.info('Sincronizando dados offline...', { duration: 2000 })
                        try {
                          const { OfflineSyncService } = await import('@/services/OfflineSyncService')
                          await OfflineSyncService.syncRouteData(route, clients, routeOrders)
                          toast.success('Download concluído!')
                        } catch (error) {
                          console.error('Error syncing route:', error)
                        }
                      } else {
                        toast.warning('Você está offline. Reconecte para baixar.')
                      }
                    }}
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" /> Baixar Dados
                 </Button>
               </div>
            ) : (
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-primary/10 rounded-lg">
                 <div className="flex items-center gap-2 text-primary font-bold">
                   <Truck className="w-5 h-5" /> Rota Liberada (Em Andamento)
                 </div>
                 <Button 
                    variant="outline"
                    className="border-primary/50 text-primary hover:bg-primary/20 bg-white/50"
                    onClick={async () => {
                      if (navigator.onLine) {
                        toast.info('Sincronizando dados offline...', { duration: 2000 })
                        try {
                          const { OfflineSyncService } = await import('@/services/OfflineSyncService')
                          await OfflineSyncService.syncRouteData(route, clients, routeOrders)
                          toast.success('Download concluído!')
                        } catch (error) {
                          console.error('Error syncing route:', error)
                        }
                      } else {
                        toast.warning('Você está offline. Reconecte para baixar.')
                      }
                    }}
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" /> Baixar para Offline
                 </Button>
               </div>
            )}
          </div>
        )}
        
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
              <div className="relative">
                <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button 
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-md shadow-lg z-50 flex flex-col p-2 space-y-1 overflow-hidden">
                      <Label className="text-xs text-muted-foreground px-2 py-1 uppercase font-semibold">Agrupar & Ordenar</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="justify-start gap-3 w-full text-left font-normal"
                        onClick={() => { setIsGroupedByCity(!isGroupedByCity); setShowMenu(false); }}
                      >
                        <MapIcon className="h-4 w-4" />
                        {isGroupedByCity ? 'Desagrupar Cidades' : 'Agrupar por Cidade'}
                      </Button>
                      
                      <div className="px-2 pb-2">
                        <select 
                          value={sortBy} 
                          onChange={(e) => { setSortBy(e.target.value as any); setShowMenu(false); }}
                          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="sequence">Por Sequência</option>
                          <option value="alphabetical">Por Ordem Alfabética</option>
                          <option value="neighborhood">Por Bairro</option>
                          <option value="status">Por Status</option>
                        </select>
                      </div>

                      {isManager && (
                        <>
                          <div className="border-t my-1" />
                          <Label className="text-xs text-muted-foreground px-2 py-1 uppercase font-semibold">Ações Gestor</Label>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left font-normal"
                            onClick={() => { setShowMenu(false); navigate(`/entregas/${id}/novo-cliente`); }}
                          >
                            <Plus className="h-4 w-4" /> Novo Cliente
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left font-normal"
                            onClick={() => { setShowMenu(false); setIsAddOsModalOpen(true); }}
                          >
                            <Plus className="h-4 w-4" /> Adicionar OS (Equipamento)
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-normal"
                            onClick={() => { setShowMenu(false); setIsMergeDialogOpen(true); }}
                          >
                            <GitMerge className="h-4 w-4" /> Mesclar Rota
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left text-green-600 hover:text-green-700 hover:bg-green-50 font-normal"
                            onClick={() => { setShowMenu(false); optimizeMutation.mutate(); }}
                            disabled={isOptimizing || isImporting || clients.length < 2}
                          >
                            <MapIcon className="h-4 w-4" /> {isOptimizing ? 'Otimizando...' : 'Otimizar Rota'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-normal"
                            onClick={() => { setShowMenu(false); fileInputRef.current?.click(); }}
                            disabled={isImporting}
                          >
                            <FileSpreadsheet className="h-4 w-4" /> {isImporting ? 'Importando...' : 'Importar Planilha'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="justify-start gap-3 w-full text-left font-normal"
                            onClick={() => { 
                              setShowMenu(false); 
                              generateRouteReportPDF(route, clients, routeOrders, company, false, checklist).catch(err => {
                                toast.error('Erro ao gerar relatório: ' + err.message);
                              });
                            }}
                          >
                            <FileDown className="h-4 w-4" /> Relatório PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>
        {isOptimizing && (
          <div className="w-full bg-blue-50 text-blue-700 text-sm p-3 rounded-md flex items-center gap-2 border border-blue-200 mt-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full" />
            <strong>Aguarde:</strong> {optimizationStatus}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {processedStops.length === 1 && processedStops[0].stops.length === 0 ? (
          <div className="glass-card text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma parada cadastrada nesta rota</p>
          </div>
        ) : (
          processedStops.map((group: any, groupIdx: number) => (
            <div key={groupIdx} className="space-y-3">
              {isGroupedByCity && (
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">{group.city}</h2>
                  <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground ml-2">
                    {group.stops.length}
                  </span>
                </div>
              )}

              {group.stops.map((stop: any, index: number) => {
                const config = statusConfig[stop.status] || statusConfig.pending
                const isClient = stop.type === 'client'
                const client = isClient ? stop.data : null
                const os = !isClient ? stop.data : null
                
                const totalItems = isClient ? (client.delivery_items?.length || 0) : 0
                const totalVolume = isClient ? (client.delivery_items?.reduce((sum: number, item: any) => sum + item.quantity_expected, 0) || 0) : 0

                return (
                  <Card key={`${stop.type}-${stop.id}`} className={`overflow-hidden border-primary/20 hover:border-primary/50 transition-all glass-card slide-up ${!isClient ? 'border-l-4 border-l-blue-500' : ''}`} style={{ animationDelay: `${index * 30}ms` }}>
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3 p-4 hover:bg-muted/10 cursor-pointer" onClick={(e) => {
                        // Impedir navegação se clicou no input de sequência
                        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                        
                        if (!isManager && !isInitialChecklistDone) {
                          toast.warning('Preencha o Checklist Inicial antes de iniciar as entregas.')
                          return;
                        }

                        if (isClient) {
                          navigate(`/entregas/cliente/${stop.id}`)
                        } else {
                          setSelectedOsToExecute(os)
                        }
                      }}>
                        
                        {/* Indicador de Sequência Editável */}
                        <div className="flex flex-col items-center justify-center shrink-0 bg-muted/30 p-1.5 rounded-md border border-border/50" onClick={e => e.stopPropagation()}>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                            Seq.
                          </span>
                          <Input 
                            type="number"
                            defaultValue={stop.delivery_sequence || ''}
                            onBlur={(e) => handleSequenceChange(stop.id, e.target.value, stop.type)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              }
                            }}
                            className="w-12 h-8 text-center font-bold text-sm p-0 bg-background"
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-foreground text-sm sm:text-base leading-tight block">
                              {(() => {
                                const customer = stop.data.customer;
                                const legalName = customer?.legal_name || customer?.nickname || stop.name;
                                const fantasyName = customer?.fantasy_name;
                                const showFantasy = fantasyName && legalName && fantasyName !== legalName;
                                return (
                                  <>
                                    <span className="align-middle">{legalName}</span>
                                    {!isClient && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full align-middle inline-block mb-1 mt-0.5">OS de Equipamento</span>}
                                    <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                                      {showFantasy ? `${fantasyName} - ` : ''}
                                      {customer?.document || ''}
                                    </span>
                                  </>
                                )
                              })()}
                            </span>
                            <Badge variant={config.variant} className="shrink-0 mt-0.5">{config.label}</Badge>
                          </div>
                          <div className="flex flex-col gap-2 mt-2">
                            {/* System Address */}
                            {(() => {
                              const customer = stop.data.customer;
                              let sysAddress = '';
                              if (customer?.address) {
                                sysAddress = `${customer.address}, ${customer.number || ''}, ${customer.neighborhood || ''}, ${customer.city || ''} - ${customer.state || ''}`.replace(/,\s*,/g, ',').replace(/, ,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
                              } else if (stop.address) {
                                sysAddress = stop.address;
                              }
                              
                              if (!sysAddress) return null;
                              
                              return (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sysAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-start gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors hover:underline w-full"
                                  title="Ver no Google Maps"
                                >
                                  <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" /> 
                                  <span className="leading-tight break-words whitespace-normal">{sysAddress}</span>
                                </a>
                              )
                            })()}

                            {/* Order, OS, Phone, Items */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              {stop.data.order_number && <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-primary font-bold">Pedido: {stop.data.order_number}</span>}
                              {!isClient && <span className="font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-bold">OS: #{stop.data.os_number}</span>}
                              {stop.data.phone && <span className="text-muted-foreground">📞 {stop.data.phone}</span>}
                              
                              {isClient && (
                                <div className="flex items-center gap-2 bg-muted/20 px-2 py-0.5 rounded text-xs text-muted-foreground border border-border/50">
                                  <span className="font-medium text-foreground">{totalItems} <span className="font-normal opacity-70">itens</span></span>
                                  <span className="text-muted-foreground/30">•</span>
                                  <span className="font-medium text-foreground">{totalVolume} <span className="font-normal opacity-70">volumes</span></span>
                                </div>
                              )}
                            </div>
                            
                            {/* Observação */}
                            {stop.data.notes && (
                              <div className="text-xs text-amber-900 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 p-2.5 rounded-lg border border-amber-300 dark:border-amber-500/20 whitespace-pre-wrap">
                                <span className="font-bold uppercase tracking-wider text-[10px] opacity-70 block mb-0.5">Observação</span>
                                {stop.data.notes.replace('Obs: ', '')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 hidden sm:block" />
                      </div>

                      {isManager && (stop.status === 'pending' || stop.status === 'pendente') && (
                        <div className="px-4 pb-3 flex justify-end border-t border-border/30 pt-2 sm:border-none sm:pt-0">
                          {isClient ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8"
                              onClick={(e) => {
                                e.preventDefault()
                                if (window.confirm('Tem certeza que deseja apagar este cliente da rota?. Esta ação não pode ser desfeita.')) {
                                  deleteClientMutation.mutate(stop.id)
                                }
                              }}
                              disabled={deleteClientMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Apagar Cliente
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8"
                              onClick={(e) => {
                                e.preventDefault()
                                if (window.confirm('Tem certeza que deseja remover esta OS da rota?. Esta ação não pode ser desfeita.')) {
                                  removeOsMutation.mutate(stop.id)
                                }
                              }}
                              disabled={removeOsMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remover OS
                            </Button>
                          )}
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

      <ExecutionModal 
        isOpen={!!selectedOsToExecute} 
        onClose={() => {
          setSelectedOsToExecute(null)
          queryClient.invalidateQueries({ queryKey: ['route_orders', id!] })
        }} 
        order={selectedOsToExecute} 
      />

      <AddOsModal 
        isOpen={isAddOsModalOpen} 
        onClose={() => setIsAddOsModalOpen(false)} 
        routeId={id!} 
      />

      <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checklist {checklistType === 'initial' ? 'Inicial' : 'Final'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Odômetro (KM) {checklistType === 'initial' ? 'ao Sair' : 'ao Chegar'} *</Label>
              <Input 
                type="number" 
                placeholder="Ex: 154200" 
                value={checklistKm}
                onChange={e => setChecklistKm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperatura do Baú (°C) {checklistType === 'initial' ? 'ao Sair' : 'ao Chegar'} (Opcional se não for refrigerado)</Label>
              <Input 
                type="number" 
                step="0.1"
                placeholder="Ex: -18.5" 
                value={checklistTemp}
                onChange={e => setChecklistTemp(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChecklistModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => {
                if (!checklistKm) {
                  toast.warning('O campo de KM é obrigatório!')
                  return
                }
                saveChecklistMutation.mutate({
                  type: checklistType,
                  km: parseFloat(checklistKm),
                  temp: checklistTemp ? parseFloat(checklistTemp) : undefined
                })
              }}
              disabled={saveChecklistMutation.isPending}
            >
              Salvar Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Mesclar com Outra Rota */}
      <Dialog open={isMergeDialogOpen} onOpenChange={(open) => !open && !isMerging && setIsMergeDialogOpen(false)}>
        <DialogContent className="max-w-md w-[95vw] rounded-xl overflow-hidden p-0 border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <GitMerge className="h-5 w-5 text-indigo-500 animate-pulse" /> Mesclar com Outra Rota
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Selecione uma rota ativa para trazer seus clientes e mercadorias para esta rota.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Rota de Origem
              </Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                value={selectedSourceRouteId}
                onChange={e => setSelectedSourceRouteId(e.target.value)}
                disabled={isMerging}
              >
                <option value="">Selecione a rota...</option>
                {otherRoutes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.title || r.operation?.load_number || 'Rota Sem Nome'} ({r.driver?.name || 'Sem motorista'})
                  </option>
                ))}
              </select>
            </div>

            {selectedSourceRouteId && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-600 dark:text-amber-400 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Ao confirmar, todos os clientes e cargas da rota selecionada serão consolidados em <strong>{route?.title || route?.operation?.load_number || 'Esta Rota'}</strong>. A rota selecionada será excluída permanentemente.
                </span>
              </div>
            )}
          </div>

          <div className="p-6 pt-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsMergeDialogOpen(false)}
              disabled={isMerging}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleMerge}
              disabled={isMerging || !selectedSourceRouteId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold px-5"
            >
              {isMerging ? 'Mesclando...' : 'Confirmar Mesclagem'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddOsModal({ isOpen, onClose, routeId }: { isOpen: boolean, onClose: () => void, routeId: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: availableOrders = [], isLoading } = useQuery({
    queryKey: ['available_orders_for_route'],
    queryFn: async () => {
      // Get all pending or in_progress OS that are not assigned to a route
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('equipment_orders')
        .select('*, customer:customers(legal_name, fantasy_name, address, number, neighborhood, city, state, document), equipment:equipments(patrimony, type, model)')
        .is('delivery_route_id', null)
        .in('status', ['pendente', 'em_rota'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as any[]
    },
    enabled: isOpen
  })

  const addOsMutation = useMutation({
    mutationFn: async (osId: string) => {
      const { equipmentsApi } = await import('@/api/equipments')
      return equipmentsApi.updateOrder(osId, { delivery_route_id: routeId, delivery_sequence: 999 })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route_orders', routeId] })
      queryClient.invalidateQueries({ queryKey: ['available_orders_for_route'] })
      toast.success('OS adicionada à rota!')
    },
    onError: (error: any) => toast.error(`Erro ao adicionar OS: ${error.message}`)
  })

  const filteredOrders = availableOrders.filter(o => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    if (o.os_number && String(o.os_number).toLowerCase().includes(term)) return true
    if (o.customer?.fantasy_name?.toLowerCase().includes(term) || o.customer?.legal_name?.toLowerCase().includes(term)) return true
    if (o.equipment?.patrimony?.toLowerCase().includes(term)) return true
    return false
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar OS à Rota</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <Input 
            placeholder="Buscar por cliente, nº OS ou patrimônio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Buscando Ordens de Serviço...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Nenhuma OS disponível para adicionar.</div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <div key={order.id} className="p-3 border rounded-md flex items-center justify-between gap-4 hover:bg-muted/30">
                  <div>
                    <div className="font-bold">
                      {(() => {
                        const legalName = order.customer?.legal_name || order.customer?.nickname || order.customer?.fantasy_name || 'Sem Cliente';
                        const fantasyName = order.customer?.fantasy_name;
                        const showFantasy = fantasyName && legalName && fantasyName !== legalName && legalName !== 'Sem Cliente';
                        return (
                          <>
                            OS #{order.os_number} - {legalName}
                            <div className="text-xs text-muted-foreground font-normal mt-0.5">
                              {showFantasy ? `${fantasyName} - ` : ''}
                              {order.customer?.document || ''}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.type.toUpperCase()} • {order.equipment?.type} {order.equipment?.model} ({order.equipment?.patrimony})
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addOsMutation.mutate(order.id)}
                    disabled={addOsMutation.isPending}
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
