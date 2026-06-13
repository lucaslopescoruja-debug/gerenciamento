import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Tag, FileUp } from 'lucide-react'
import { priceTablesApi } from '@/api/priceTables'
import { productsApi } from '@/api/products'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import * as XLSX from 'xlsx'

export default function PriceTablesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: priceTables = [], isLoading } = useQuery({
    queryKey: ['priceTables'],
    queryFn: priceTablesApi.getPriceTables
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts
  })

  const deleteMutation = useMutation({
    mutationFn: priceTablesApi.deletePriceTable,
    onSuccess: () => {
      toast.success('Tabela de preço removida com sucesso')
      queryClient.invalidateQueries({ queryKey: ['priceTables'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover tabela de preço: ${e.message}`)
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a tabela "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // Lê as duas primeiras linhas para pegar código e título
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })
      
      if (rows.length < 3) {
        toast.error('O arquivo não possui o formato esperado (Código, Título, e cabeçalhos).')
        return
      }

      const tableCode = String(rows[0][0] || '').trim()
      const tableTitle = String(rows[1][0] || '').trim()

      if (!tableTitle) {
        toast.error('Título da tabela não encontrado na linha 2.')
        return
      }

      // Lê os dados a partir da linha 3 (index 2) usando a linha 3 como cabeçalho
      const json = XLSX.utils.sheet_to_json<any>(worksheet, { range: 2 })

      if (json.length === 0) {
        toast.warning('A planilha não contém produtos a partir da linha 4.')
        return
      }

      toast.info('Criando tabela e importando itens... aguarde.')

      // Cria a tabela
      const newTable = await priceTablesApi.createPriceTable({
        code: tableCode,
        name: tableTitle,
        active: true
      })

      const newItems: any[] = []
      let notFoundCount = 0

      json.forEach(row => {
        const codeValue = row['Código'] || row['codigo'] || row['Codigo'] || row['CÓDIGO']
        const priceValue = row['Preço'] || row['preço'] || row['Preco'] || row['PREÇO'] || row['PRECO']
        const discountValue = row['Desconto (%)'] || row['Desconto'] || row['desconto'] || row['DESCONTO']

        if (!codeValue || !priceValue) return

        const codeStr = normalizeCode(String(codeValue))
        const matchedProduct = products.find(p => normalizeCode(p.code) === codeStr || (p.external_code && normalizeCode(p.external_code) === codeStr))

        if (matchedProduct) {
          let priceNum = 0
          if (typeof priceValue === 'number') {
            priceNum = priceValue
          } else {
            const priceStrRaw = String(priceValue).split('/')[0].replace(/[^0-9,.]/g, '')
            priceNum = parseFloat(priceStrRaw.replace(',', '.'))
          }

          let discountNum = 0
          if (discountValue !== undefined && discountValue !== null && discountValue !== '') {
            if (typeof discountValue === 'number') {
               discountNum = discountValue
            } else {
               discountNum = parseFloat(String(discountValue).replace(',', '.'))
            }
          }

          if (priceNum > 0) {
            newItems.push({
              price_table_id: newTable.id,
              product_id: matchedProduct.id,
              price: priceNum,
              discount_percent: discountNum || 0,
              max_discount_percent: discountNum || 0
            })
          }
        } else {
          notFoundCount++
        }
      })

      // Deduplicate items by product_id
      const uniqueItemsMap = new Map<string, any>()
      newItems.forEach(item => {
        uniqueItemsMap.set(item.product_id, item)
      })
      const finalItems = Array.from(uniqueItemsMap.values())

      if (finalItems.length > 0) {
        await priceTablesApi.bulkAddPriceTableItems(finalItems)
        toast.success(`Tabela "${tableTitle}" criada com ${finalItems.length} produtos!`)
        if (notFoundCount > 0) {
          toast.warning(`${notFoundCount} códigos não encontrados no sistema.`)
        }
        queryClient.invalidateQueries({ queryKey: ['priceTables'] })
        // Redireciona para a tela de edição da nova tabela
        navigate(`/cadastros/tabelas-de-preco/${newTable.id}/editar`)
      } else {
        toast.warning(`Tabela criada, mas nenhum item válido foi encontrado no Excel.`)
        queryClient.invalidateQueries({ queryKey: ['priceTables'] })
        navigate(`/cadastros/tabelas-de-preco/${newTable.id}/editar`)
      }

    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar arquivo Excel ou criar tabela.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filteredTables = useMemo(() => {
    let result = priceTables.filter(t => {
      const s = searchTerm.toLowerCase()
      return (
        (t.name || '').toLowerCase().includes(s) ||
        (t.code || '').toLowerCase().includes(s)
      )
    })

    result.sort((a, b) => {
      const codeA = a.code || ''
      const codeB = b.code || ''
      
      const numA = parseInt(codeA, 10)
      const numB = parseInt(codeB, 10)

      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB
      }

      return codeA.localeCompare(codeB)
    })

    return result
  }, [priceTables, searchTerm])

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Tabelas de Preço
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as tabelas de preço que podem ser vinculadas aos clientes.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto shadow-sm hover:scale-105 transition-transform text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10">
            <FileUp className="mr-2 h-4 w-4" /> Importar Excel (Nova Tabela)
          </Button>
          <Link to="/cadastros/tabelas-de-preco/nova">
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-4 w-4" /> Nova Tabela
            </Button>
          </Link>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium w-24">Status</th>
                <th className="px-4 py-3 font-medium w-32">Código</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Carregando tabelas de preço...</td></tr>
              ) : filteredTables.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma tabela encontrada.</td></tr>
              ) : (
                filteredTables.map(table => (
                  <tr key={table.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        table.active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {table.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{table.code || '-'}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{table.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/tabelas-de-preco/${table.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(table.id, table.name)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
          <span>Total: <strong>{filteredTables.length}</strong> tabelas</span>
        </div>
      </div>
    </div>
  )
}
