import { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { usersApi } from '@/api/users'
import { deliveriesApi } from '@/api/deliveries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, Trash2, ClipboardList, Truck, User, Search, Upload, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface NewItem {
  tempId: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
}

export default function CreateLoad() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  const [loadNumber, setLoadNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [helperName, setHelperName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<NewItem[]>([])
  const [codeSearch, setCodeSearch] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedHelperId, setSelectedHelperId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [importedClients, setImportedClients] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  
  // Lists for autocomplete
  const [savedDrivers, setSavedDrivers] = useState<string[]>([])
  const [savedVehicles, setSavedVehicles] = useState<string[]>([])
  const [savedHelpers, setSavedHelpers] = useState<string[]>([])

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('coletor_drivers') || '[]')
      const v = JSON.parse(localStorage.getItem('coletor_vehicles') || '[]')
      const h = JSON.parse(localStorage.getItem('coletor_helpers') || '[]')
      if (Array.isArray(d)) setSavedDrivers(d)
      if (Array.isArray(v)) setSavedVehicles(v)
      if (Array.isArray(h)) setSavedHelpers(h)
    } catch(e) {}
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(company?.id),
    enabled: !!company?.id,
  })
  
  const drivers = usersList.filter(u => u.role === 'motorista' && u.active)
  const helpers = usersList.filter(u => u.role === 'ajudante' && u.active)

  const { data: existingOp } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => operationsApi.getOperation(id!),
    enabled: !!id,
  })

  const { data: existingItems = [] } = useQuery({
    queryKey: ['operation_items', id],
    queryFn: () => operationsApi.getOperationItems(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (existingOp) {
      setLoadNumber(existingOp.load_number || '')
      setDriverName(existingOp.driver_name || '')
      setVehiclePlate(existingOp.vehicle_plate || '')
      let n = existingOp.notes || ''
      let h = ''
      if (n.startsWith('Ajudante: ')) {
        const lines = n.split('\n')
        h = lines[0].replace('Ajudante: ', '').trim()
        n = lines.slice(1).join('\n')
      }
      setHelperName(h)
      setNotes(n)

      if (existingOp.driver_name && drivers.length > 0) {
        const matched = drivers.find(d => d.name === existingOp.driver_name)
        if (matched) {
          setSelectedDriverId(matched.id)
        }
      }
    }
  }, [existingOp, drivers])

  useEffect(() => {
    if (existingItems.length > 0 && items.length === 0) {
      setItems(existingItems.map((i, idx) => ({
        tempId: `e${idx}`,
        product_id: i.product_id,
        product_code: i.product_code,
        description: i.description,
        quantity_expected: i.quantity_expected
      })))
    }
  }, [existingItems])

  const createMutation = useMutation({
    mutationFn: async (data: { op: any, items: any, clients?: any[], scheduledDate?: string }) => {
      const op = await operationsApi.createOperation(data.op, data.items)
      if (data.clients && data.clients.length > 0) {
        const route = await deliveriesApi.createDeliveryRoute(op.id, null, null, data.scheduledDate)
        await deliveriesApi.importDeliveryClients(route.id, data.clients)
      }
      return op
    },
    onSuccess: (op, variables) => {
      if (variables.clients && variables.clients.length > 0) {
        toast.success('Carga e rota de entregas criadas com sucesso!')
      } else {
        toast.success('Carga criada com sucesso!')
      }
      navigate('/cargas')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar: ${error.message}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.updateOperationFull(id!, data.op, data.items),
    onSuccess: () => {
      toast.success('Carga atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      queryClient.invalidateQueries({ queryKey: ['operation_items', id] })
      navigate(`/conferencia/${id}`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar carga: ${error.message}`)
    }
  })

  // Helper to strip non-alphanumeric characters and uppercase for comparison
  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  useEffect(() => {
    if (codeSearch.trim().length > 0) {
      const term = normalizeCode(codeSearch.trim());
      const filtered = products.filter(p => 
        normalizeCode(p.code).includes(term) || 
        (p.external_code && normalizeCode(p.external_code).includes(term)) || 
        normalizeCode(p.description).includes(term)
      ).slice(0, 10);
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  }, [codeSearch, products]);

  const addExactMatch = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;
    const term = normalizeCode(raw);
    const product = products.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    if (!product) { 
      toast.error('Produto não encontrado com esse código exato'); 
      return; 
    }
    addSelectedProduct(product);
  }

  const addSelectedProduct = (product: any) => {
    const exists = items.find(i => i.product_code === product.code)
    const currentQty = exists ? exists.quantity_expected : 0
    const targetQty = currentQty + 1
    
    if (targetQty > product.stock) {
      if (product.stock <= 0) {
        toast.warning(`Produto com estoque zerado no sistema: ${product.description}. Confirmar no físico durante a conferência.`)
      } else {
        toast.warning(`Estoque no sistema menor que o previsto para ${product.description}. Pedido: ${targetQty}, Disponível: ${product.stock}. Confirmar no físico durante a conferência.`)
      }
    }

    if (exists) {
      setItems(prev => prev.map(i => i.product_code === product.code ? { ...i, quantity_expected: targetQty } : i))
      toast.success(`Quantidade aumentada para ${product.description}`)
    } else {
      setItems(prev => [...prev, { tempId: `t${Date.now()}`, product_id: product.id, product_code: product.code, description: product.description, quantity_expected: 1 }])
      toast.success(`${product.description} adicionado`)
    }
    setCodeSearch('')
    setShowDropdown(false)
  }

  const updateQty = (tempId: string, qty: number) => {
    setItems(prev => prev.map(i => {
      if (i.tempId === tempId) {
        const product = products.find(p => p.code === i.product_code)
        const maxQty = product?.stock || 0
        const targetQty = Math.max(1, qty)
        if (targetQty > maxQty) {
          if (maxQty <= 0) {
            toast.warning(`Produto com estoque zerado no sistema: ${i.description}. Confirmar no físico durante a conferência.`)
          } else {
            toast.warning(`Estoque no sistema menor que o previsto para ${i.description}. Pedido: ${targetQty}, Disponível: ${maxQty}. Confirmar no físico durante a conferência.`)
          }
        }
        return { ...i, quantity_expected: targetQty }
      }
      return i
    }))
  }

  if (!isManager) {
    return <Navigate to="/cargas" replace />
  }

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][]

        // 1. Check if the spreadsheet contains client data (rows starting with 'À ' or 'Numero de pedido:')
        const hasClientData = data.some(row => {
          if (!row) return false
          const firstCell = row.find(c => c)
          const isAntigo = typeof firstCell === 'string' && firstCell.trim().startsWith('À ')
          const isNovo = row.some(c => typeof c === 'string' && (c.includes('Numero de pedido') || c.includes('Razao Social')))
          return isAntigo || isNovo
        })

        if (hasClientData) {
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

          const clientsData = Array.from(clientsMap.values())
          if (clientsData.length === 0) {
            toast.error('Nenhum dado válido de cliente encontrado na planilha.')
            return
          }

          // Compile product list for the load items (sum of quantity of each product across all clients)
          const productSumMap = new Map<string, { product_id: string | null, product_code: string, description: string, quantity_expected: number }>()

          for (const client of clientsData) {
            for (const item of client.items) {
              const existing = productSumMap.get(item.product_code)
              if (existing) {
                existing.quantity_expected += item.quantity_expected
              } else {
                productSumMap.set(item.product_code, {
                  product_id: item.product_id,
                  product_code: item.product_code,
                  description: item.description,
                  quantity_expected: item.quantity_expected
                })
              }
            }
          }

          const loadItems: NewItem[] = Array.from(productSumMap.values()).map((p, idx) => ({
            tempId: `t${Date.now()}_${idx}`,
            product_id: p.product_id || '',
            product_code: p.product_code,
            description: p.description,
            quantity_expected: p.quantity_expected
          }))

          setItems(loadItems)
          setImportedClients(clientsData)

          toast.success(`Planilha de clientes importada! ${clientsData.length} clientes e ${loadItems.length} produtos consolidados.`)
          if (notFoundCount > 0) {
            toast.warning(`${notFoundCount} produtos não foram encontrados no banco de dados.`)
          }
        } else {
          // Standard product-only parser (original parser)
          let addedCount = 0
          let notFoundCount = 0
          const newItems: NewItem[] = []

          for (let i = 0; i < data.length; i++) {
            const row = data[i]
            if (!row || row.length === 0) continue

            let parts = row.map(cell => {
              if (cell === undefined || cell === null) return ''
              return String(cell).trim()
            }).filter(Boolean)

            if (parts.length < 2) continue

            const firstPart = parts[0].toLowerCase()
            if (firstPart.includes('cod') || firstPart.includes('código') || firstPart.includes('itens') || firstPart.includes('relatório') || firstPart.includes('delicius') || firstPart.includes('quantidade')) {
              continue
            }

            const codePart = parts[0]
            const qtyPart = parts[parts.length - 1]

            let rawCode = codePart
            if (rawCode.includes(' - ')) {
              rawCode = rawCode.split(' - ')[0].trim()
            }
            let code = rawCode;
            if (!code) continue;
        
            const normalizedImportCode = normalizeCode(code);
            const product = products.find(p => normalizeCode(p.code) === normalizedImportCode || (p.external_code && normalizeCode(p.external_code) === normalizedImportCode));

            if (product) {
              const qty = Math.round(parseFloat(qtyPart.replace(',', '.')))

              if (code && !isNaN(qty)) {
                let finalQty = qty
                if (finalQty > product.stock) {
                  if (product.stock <= 0) {
                    toast.warning(`Falta de estoque (estoque zerado): ${product.description}. Pedido: ${qty}. Confirmar no físico durante a conferência.`)
                  } else {
                    toast.warning(`Estoque no sistema menor que o previsto para ${product.description}. Pedido: ${qty}, Disponível: ${product.stock}. Confirmar no físico durante a conferência.`)
                  }
                }

                const exists = items.some(it => it.product_code === product.code) || newItems.some(it => it.product_code === product.code)
                if (!exists && finalQty > 0) {
                  newItems.push({
                    tempId: `t${Date.now()}_${addedCount}`,
                    product_id: product.id,
                    product_code: product.code,
                    description: product.description,
                    quantity_expected: Math.max(1, finalQty)
                  })
                  addedCount++
                }
              }
            } else {
              notFoundCount++
            }
          }

          if (newItems.length > 0) {
            setItems(prev => [...prev, ...newItems])
            toast.success(`${addedCount} itens de carga importados com sucesso.`)
          }
          
          if (notFoundCount > 0) {
            toast.info(`${notFoundCount} linhas ignoradas ou produtos não encontrados.`)
          }

          // Clear client-specific states
          setImportedClients([])
        }
      } catch (error) {
        toast.error('Erro ao processar arquivo. Verifique o formato.')
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loadNumber || items.length === 0) {
      toast.error('Preencha o Nome da Rota e adicione itens')
      return
    }

    // Save new values to memory
    if (driverName.trim() && !savedDrivers.includes(driverName.trim())) {
      const newD = [...savedDrivers, driverName.trim()]
      setSavedDrivers(newD)
      localStorage.setItem('coletor_drivers', JSON.stringify(newD))
    }
    if (vehiclePlate.trim() && !savedVehicles.includes(vehiclePlate.trim())) {
      const newV = [...savedVehicles, vehiclePlate.trim()]
      setSavedVehicles(newV)
      localStorage.setItem('coletor_vehicles', JSON.stringify(newV))
    }
    if (helperName.trim() && !savedHelpers.includes(helperName.trim())) {
      const newH = [...savedHelpers, helperName.trim()]
      setSavedHelpers(newH)
      localStorage.setItem('coletor_helpers', JSON.stringify(newH))
    }

    const finalNotes = helperName.trim() ? `Ajudante: ${helperName.trim()}\n${notes}` : notes

    const selectedDriver = drivers.find(d => d.id === selectedDriverId)
    const finalDriverName = selectedDriver ? selectedDriver.name : driverName

    const opData = {
      type: 'LOAD' as const,
      status: 'pending' as const,
      load_number: loadNumber,
      client_name: 'Diversos', // Temporary default since we removed client
      driver_name: finalDriverName,
      vehicle_plate: vehiclePlate,
      notes: finalNotes,
    }

    const itemsData = items.map(i => {
      const product = products.find(p => p.code === i.product_code)
      const systemStock = product ? product.stock : 0
      return {
        product_id: i.product_id || null,
        product_code: i.product_code,
        description: i.description,
        quantity_expected: i.quantity_expected,
        quantity_scanned: 0,
        status: 'pending' as const,
        system_stock_at_load: systemStock,
        physical_verification: 'pending' as const,
        physical_divergence_found: false,
        divergence_resolved: false
      }
    })

    if (id) {
      updateMutation.mutate({ op: opData, items: itemsData })
    } else {
      createMutation.mutate({ 
        op: opData, 
        items: itemsData,
        clients: importedClients.length > 0 ? importedClients : undefined,
        scheduledDate: scheduledDate || undefined
      })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">{id ? 'Editar Rota' : 'Nova Rota'}</h1>
          <p className="text-sm text-muted-foreground">{id ? 'Atualizar operação existente' : 'Criar operação de expedição'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />Dados da Rota</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome da Rota *</Label>
                <Input value={loadNumber} onChange={e => setLoadNumber(e.target.value)} placeholder="Ex: Rota Centro 01" required />
              </div>

              <div className="space-y-2">
                <Label>Data Prevista de Entrega</Label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required={importedClients.length > 0} />
              </div>
            </div>

            {importedClients.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 slide-up mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>✨ Planilha com {importedClients.length} clientes vinculada!</strong> Ao salvar esta carga, o sistema criará automaticamente a carga e a rota de entrega correspondente. Você poderá designar o motorista depois.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />Itens da Carga
            </CardTitle>
            <div>
              <input type="file" accept=".csv,.txt,.xls,.xlsx" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Importar Planilha
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={codeSearch} 
                  onChange={e => setCodeSearch(e.target.value)} 
                  placeholder="Código exato ou busque por descrição..." 
                  className="pl-10" 
                  onKeyDown={e => { 
                    if (e.key === 'Enter') { 
                      e.preventDefault(); 
                      if (filteredProducts.length === 1 && normalizeCode(filteredProducts[0].code) === normalizeCode(codeSearch.trim())) {
                         addSelectedProduct(filteredProducts[0]);
                      } else {
                         addExactMatch(codeSearch); 
                      }
                    } 
                  }} 
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onFocus={() => { if (codeSearch.trim().length > 0) setShowDropdown(true) }}
                />
                
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => addSelectedProduct(p)}
                      >
                        <span className="text-sm font-medium">{p.description}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && codeSearch.trim().length > 0 && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
              <Button type="button" onClick={() => addExactMatch(codeSearch)}><Plus className="h-4 w-4" /></Button>
            </div>

            {items.length === 0 ? (
              <div className="glass-card text-center py-8"><p className="text-muted-foreground text-sm">Nenhum item adicionado</p></div>
            ) : (
              <div className="space-y-2">
                {items.map(item => {
                  const product = products.find(p => p.code === item.product_code)
                  const stock = product ? product.stock : 0
                  const hasAlert = stock <= 0 || stock < item.quantity_expected
                  return (
                    <div key={item.tempId} className={`glass-card p-3 flex flex-col gap-2 transition-all ${hasAlert ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                        </div>
                        <Input type="number" className="w-20 text-center font-mono" value={item.quantity_expected} onChange={e => updateQty(item.tempId, Number(e.target.value))} min={1} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.tempId)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                      {hasAlert && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 slide-up">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>
                            Estoque no sistema menor que o previsto. Confirmar no físico durante a conferência. 
                            <span className="font-semibold ml-1">(Disponível: {stock})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Criar Rota')}
        </Button>
      </form>
    </div>
  )
}
