import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { salesApi } from '@/api/sales'
import { productsApi } from '@/api/products'

interface ImportOrdersModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportOrdersModal({ isOpen, onOpenChange }: ImportOrdersModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const { company } = useAuth()
  const queryClient = useQueryClient()

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups'],
    queryFn: salesApi.getOrderGroups,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : ''

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][]

        const hasClientData = data.some(row => {
          if (!row) return false
          const firstCell = row.find(c => c)
          const isAntigo = typeof firstCell === 'string' && firstCell.trim().startsWith('À ')
          const isNovo = row.some(c => typeof c === 'string' && (c.includes('Numero de pedido') || c.includes('Razao Social')))
          return isAntigo || isNovo
        })

        if (!hasClientData) {
          toast.error('Formato de planilha inválido ou sem clientes/pedidos identificáveis.')
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }

        const clientsMap = new Map<string, any>()
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
            const doc = firstCell.replace(/cnpj\/cpf:|cnpj:|cpf:/i, '').replace(/[^\d]/g, '').trim()
            if (doc && currentClientKey && clientsMap.has(currentClientKey)) {
               clientsMap.get(currentClientKey).document = doc
            }
          }

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

          // ITEMS
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
                     foundProduct = products.find((prod: any) => {
                       const pCode = normalizeCode(prod.code)
                       const pExt = prod.external_code ? normalizeCode(prod.external_code) : null
                       if (pCode === normalizedCode || pExt === normalizedCode) return true
                       return false
                     })
                   }

                   let descCell = row[5] || row[4] || row[3]
                   let qtyCell = row[11] || row[10] || row[12]
                   
                   if (row[11] === undefined && row[10] === undefined && row[12] === undefined) {
                     descCell = row[3]
                     qtyCell = row[4]
                   }

                   let qty = 1
                   if (qtyCell) {
                      let strQty = String(qtyCell).trim()
                      if (!strQty.includes('/') && !strQty.includes(':')) {
                        strQty = strQty.replace(',', '.')
                        const numericPartMatch = strQty.match(/[\d.]+/)
                        if (numericPartMatch) {
                           const parsed = parseFloat(numericPartMatch[0])
                           if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
                              qty = Math.round(parsed)
                           }
                        }
                      }
                   } 

                   if (foundProduct) {
                     clientsMap.get(currentClientKey).items.push({
                       product_id: foundProduct.id,
                       quantity: qty,
                       unit_price: 0,
                       discount_percent: 0,
                       net_price: 0,
                       total_price: 0
                     })
                   }
                }
             }
          }
        }

        const parsedClients = Array.from(clientsMap.values())
        if (parsedClients.length === 0) {
          toast.error('Nenhum pedido encontrado na planilha.')
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }

        let createdCount = 0
        for (const client of parsedClients) {
          if (client.items.length === 0) continue

          let total_amount = 0
          client.items.forEach((i: any) => total_amount += i.total_price)

          const order = {
            company_id: company!.id,
            customer_id: null,
            sales_rep_id: null,
            price_table_id: null,
            payment_condition_id: null,
            order_group_id: selectedGroupId || null,
            status: 'Faturado' as any,
            total_amount: total_amount,
            total_discount: 0,
            net_amount: total_amount,
            notes: `Pedido importado: ${client.name}\n${client.notes || ''}`.trim(),
            delivery_date: null,
            ...(client.order_number ? { order_number: parseInt(client.order_number, 10) } : {})
          }

          const createdOrder = await salesApi.createSalesOrder(order)

          const itemsToInsert = client.items.map((item: any) => ({
            ...item,
            sales_order_id: createdOrder.id
          }))
          
          await salesApi.addSalesOrderItems(itemsToInsert)
          createdCount++
        }

        toast.success(`${createdCount} pedidos importados com sucesso!`)
        queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
        onOpenChange(false)
      } catch (err: any) {
        toast.error(`Erro ao processar planilha: ${err.message}`)
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Planilha MaxiProd</DialogTitle>
          <DialogDescription>
            Importe pedidos através de uma planilha. Você pode opcionalmente vinculá-los a um grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vincular ao Grupo (Opcional)</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
            >
              <option value="">-- Sem Grupo --</option>
              {orderGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <input 
              type="file" 
              accept=".csv,.xls,.xlsx" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <Button 
              className="w-full gap-2" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4" /> 
              {isImporting ? 'Importando...' : 'Selecionar Arquivo e Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
