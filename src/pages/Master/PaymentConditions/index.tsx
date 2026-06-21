import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { Banknote, Plus, Pencil, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default function PaymentConditions() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: conditions = [], isLoading } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: salesApi.getPaymentConditions,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string, active: boolean }) => 
      salesApi.updatePaymentCondition(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_conditions'] })
      toast.success('Status atualizado')
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: salesApi.deletePaymentCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_conditions'] })
      toast.success('Condição removida')
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`)
  })

  const filteredConditions = conditions.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  type SortFieldType = 'name' | 'installments' | 'active' | null
  const [sortField, setSortField] = useState<SortFieldType>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const renderSortIcon = (field: SortFieldType) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
  }

  const sortedConditions = useMemo(() => {
    const sorted = [...filteredConditions]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'active': valA = a.active ? 1 : 0; valB = b.active ? 1 : 0; break;
        case 'name': valA = a.name; valB = b.name; break;
        case 'installments': valA = a.installments; valB = b.installments; break;
      }

      valA = valA ?? ''
      valB = valB ?? ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' })
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredConditions, sortField, sortAsc])

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta condição de pagamento? Ela pode estar sendo usada por clientes.. Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Banknote className="h-7 w-7 text-primary" />
            Condições de Pagamento
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os prazos e condições oferecidos aos clientes.</p>
        </div>
        <Link to="/cadastros/condicoes-pagamento/nova">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Condição
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                  Nome {renderSortIcon('name')}
                </th>
                <th className="px-4 py-3 font-medium text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('installments')}>
                  Parcelas {renderSortIcon('installments')}
                </th>
                <th className="px-4 py-3 font-medium text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('active')}>
                  Status {renderSortIcon('active')}
                </th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : sortedConditions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma condição encontrada.</td></tr>
              ) : (
                sortedConditions.map(condition => (
                  <tr key={condition.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{condition.name}</td>
                    <td className="px-4 py-3 text-center">{condition.installments}x</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={condition.active ? 'success' : 'secondary'} className="cursor-pointer" onClick={() => toggleActiveMutation.mutate({ id: condition.id, active: !condition.active })}>
                        {condition.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/cadastros/condicoes-pagamento/${condition.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500" onClick={() => handleDelete(condition.id)}>
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
      </div>
    </div>
  )
}
