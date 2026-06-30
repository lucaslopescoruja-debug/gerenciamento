import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toaster'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase, fetchAllRows } from '@/lib/supabase'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'

interface ImportMaxiprodModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedOrder {
  orderNumber: string
  customerCnpj: string
  items: ParsedItem[]
  observations: string
  // Resolved info
  customerId?: string
  priceTableId?: string
  salesRepId?: string
  companyId?: string
  customerName?: string
  isValid?: boolean
  error?: string
}

interface ParsedItem {
  code: string
  name: string
  quantity: number
  // Resolved info
  productId?: string
  unitPrice?: number
  isValid?: boolean
}

export function ImportMaxiprodModal({ isOpen, onOpenChange }: ImportMaxiprodModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const [isParsing, setIsParsing] = useState(false)
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([])

  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups'],
    queryFn: salesApi.getOrderGroups
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setParsedOrders([])

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      const orders: ParsedOrder[] = []
      let currentOrder: ParsedOrder | null = null
      let parsingItems = false

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Look for the start of a new order
        if (row[1] === 'Numero de pedido:') {
          if (currentOrder) {
            orders.push(currentOrder)
          }
          currentOrder = {
            orderNumber: String(row[2] || '').trim(),
            customerCnpj: '',
            items: [],
            observations: ''
          }
          parsingItems = false
          continue
        }

        if (!currentOrder) continue

        if (row[1] === 'CNPJ:') {
          currentOrder.customerCnpj = String(row[2] || '').trim()
          continue
        }

        const r1 = String(row[1] || '').trim()
        const r2 = String(row[2] || '').trim()
        const r3 = String(row[3] || '').trim()
        
        // Use includes to avoid exact accent matching issues
        if (r1 === '#' && r2.includes('digo') && r3.includes('Item')) {
          parsingItems = true
          continue
        }

        if (parsingItems) {
          if (row[1] && String(row[1]).startsWith('Quantidade de Volumes:')) {
            parsingItems = false
            continue
          }

          if (row[2] && row[3]) {
            currentOrder.items.push({
              code: String(row[2]).trim(),
              name: String(row[3]).trim(),
              quantity: Number(row[4]) || 1
            })
          }
        }

        // Avoid exact match due to potential encoding issues in row[1]
        if (r1.includes('Observa')) {
          let obsRowIndex = i + 1
          while (obsRowIndex < rows.length && (!rows[obsRowIndex] || !rows[obsRowIndex][1])) {
            obsRowIndex++
          }
          if (obsRowIndex < rows.length && rows[obsRowIndex][1] && rows[obsRowIndex][1] !== 'Atenciosamente,') {
            currentOrder.observations = String(rows[obsRowIndex][1]).trim()
          }
        }
      }

      if (currentOrder) {
        orders.push(currentOrder)
      }

      await validateAndHydrateOrders(orders)
    } catch (error: any) {
      toast.error('Erro ao ler arquivo: ' + error.message)
    } finally {
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const validateAndHydrateOrders = async (orders: ParsedOrder[]) => {
    const hydratedOrders = [...orders]

    // Fetch all customers for safe CNPJ matching
    const customersQuery = supabase
      .from('customers')
      .select('id, document, fantasy_name, price_table_id, sales_rep_id, company_id')
    
    const customers = await fetchAllRows(customersQuery)

    const productsQuery = supabase
      .from('products')
      .select('id, code, external_code')
    
    const products = await fetchAllRows(productsQuery)

    const priceTableIds = [...new Set(customers?.map((c: any) => c.price_table_id).filter(Boolean) || [])]
    
    let priceTableItems: any[] = []
    if (priceTableIds.length > 0) {
      const ptiQuery = supabase
        .from('price_table_items')
        .select('price_table_id, product_id, price')
        .in('price_table_id', priceTableIds)
      
      const pti = await fetchAllRows(ptiQuery)
      if (pti) priceTableItems = pti
    }

    for (const order of hydratedOrders) {
      order.isValid = true
      order.error = ''

      const cleanOrderCnpj = order.customerCnpj.replace(/[^\d]/g, '')
      const customer = customers?.find((c: any) => (c.document || '').replace(/[^\d]/g, '') === cleanOrderCnpj)

      if (!customer) {
        order.isValid = false
        order.error = 'Cliente não encontrado.'
        continue
      }
      
      order.customerId = customer.id
      order.priceTableId = customer.price_table_id
      order.salesRepId = customer.sales_rep_id
      order.companyId = customer.company_id
      order.customerName = customer.fantasy_name

      if (!order.priceTableId) {
        order.isValid = false
        order.error = 'Cliente sem tab. de preços.'
        continue
      }

      if (order.items.length === 0) {
        order.isValid = false
        order.error = 'Pedido sem itens.'
        continue
      }

      for (const item of order.items) {
        const itemCodeStr = String(item.code).trim()
        
        let product = products?.find((p: any) => 
          String(p.code || '').trim() === itemCodeStr || 
          String(p.external_code || '').trim() === itemCodeStr
        )

        if (!product) {
          const c1 = itemCodeStr.replace(/^0+/, '')
          product = products?.find((p: any) => {
            const pc = String(p.code || '').trim().replace(/^0+/, '')
            const pec = String(p.external_code || '').trim().replace(/^0+/, '')
            return pc === c1 || pec === c1
          })
        }

        if (!product) {
          item.isValid = false
          order.isValid = false
          order.error = `Prod ${item.code} não enc.`
          continue
        }
        item.productId = product.id

        const priceItem = priceTableItems.find((pti: any) => 
          pti.price_table_id === order.priceTableId && 
          pti.product_id === product.id
        )

        if (!priceItem) {
          item.isValid = false
          order.isValid = false
          order.error = `Prod ${item.code} s/ preço.`
          continue
        }

        item.unitPrice = priceItem.price
        item.isValid = true
      }
    }

    setParsedOrders(hydratedOrders)
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const validOrders = parsedOrders.filter(o => o.isValid)
      if (validOrders.length === 0) throw new Error('Nenhum pedido válido para importar')

      const { data: session } = await supabase.auth.getSession()
      let companyId = company?.id
      if (!companyId && session.session?.user.id) {
        const userRes = await supabase.from('users').select('company_id').eq('id', session.session.user.id).single()
        companyId = userRes.data?.company_id
      }
      
      if (!companyId) throw new Error('Empresa não identificada.')

      let finalGroupId = selectedGroupId || null

      if (isCreatingGroup && newGroupName.trim()) {
        const newGroup = await salesApi.createOrderGroup({
          name: newGroupName.trim(),
          company_id: companyId,
          active: true
        })
        finalGroupId = newGroup.id
      }

      for (const order of validOrders) {
        const totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0)

        const createdOrder = await salesApi.createSalesOrder({
          company_id: order.companyId || companyId || undefined,
          customer_id: order.customerId!,
          sales_rep_id: order.salesRepId || null,
          status: 'Faturado',
          total_amount: totalAmount,
          total_discount: 0,
          net_amount: totalAmount,
          notes: order.observations || '',
          delivery_date: null,
          price_table_id: order.priceTableId || null,
          payment_condition_id: null,
          order_group_id: finalGroupId,
          ...(order.orderNumber ? { order_number: parseInt(order.orderNumber, 10) } : {})
        } as any)

        if (!createdOrder) throw new Error('Erro ao criar pedido no banco.')

        const itemsToInsert = order.items.map(item => ({
          sales_order_id: createdOrder.id,
          product_id: item.productId!,
          quantity: item.quantity,
          unit_price: item.unitPrice!,
          discount_percent: 0,
          net_price: item.unitPrice!,
          total_price: item.quantity * item.unitPrice!
        }))

        await salesApi.addSalesOrderItems(itemsToInsert as any)
      }
    },
    onSuccess: () => {
      toast.success('Os pedidos válidos foram importados com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      onOpenChange(false)
      setParsedOrders([])
    },
    onError: (error: any) => {
      toast.error('Erro na importação: ' + error.message)
    }
  })

  const validCount = parsedOrders.filter(o => o.isValid).length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pedidos (Maxiprod)</DialogTitle>
          <DialogDescription>
            Selecione a planilha do Maxiprod para importar os pedidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing || importMutation.isPending}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">
                  {isParsing ? 'Analisando arquivo...' : 'Clique para selecionar a planilha (.xlsx)'}
                </span>
              </div>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>

          {parsedOrders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Pré-visualização dos Pedidos</h3>
                <span className="text-sm text-muted-foreground">
                  {validCount} de {parsedOrders.length} válidos
                </span>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Qtd Itens</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedOrders.map((order, index) => (
                      <TableRow key={index} className={!order.isValid ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {order.customerName ? order.customerName : <span className="text-muted-foreground">{order.customerCnpj}</span>}
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>
                          {order.isValid ? (
                            <span className="flex items-center text-emerald-600 text-sm font-medium">
                              <CheckCircle className="h-4 w-4 mr-1" /> OK
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="flex items-center text-red-600 text-sm font-medium">
                                <AlertCircle className="h-4 w-4 mr-1" /> Inválido
                              </span>
                              <span className="text-xs text-red-500 mt-1">{order.error}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 border rounded-md bg-muted/20">
                <h3 className="font-semibold text-sm">Agrupar Pedidos (Opcional)</h3>
                <div className="flex flex-col gap-3">
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={isCreatingGroup ? 'new' : selectedGroupId}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsCreatingGroup(true)
                        setSelectedGroupId('')
                      } else {
                        setIsCreatingGroup(false)
                        setSelectedGroupId(e.target.value)
                      }
                    }}
                  >
                    <option value="">Nenhum grupo</option>
                    {orderGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    <option value="new">+ Criar Novo Grupo</option>
                  </select>
                  
                  {isCreatingGroup && (
                    <Input 
                      placeholder="Nome do novo grupo..." 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {validCount > 0 && (
                <Button 
                  className="w-full font-bold" 
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? 'Importando...' : `Importar ${validCount} pedido(s)`}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
