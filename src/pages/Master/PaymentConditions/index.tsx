import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { Banknote, Plus, Pencil, Search, Trash2 } from 'lucide-react'

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

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta condição de pagamento? Ela pode estar sendo usada por clientes.')) {
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
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium text-center">Parcelas</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filteredConditions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma condição encontrada.</td></tr>
              ) : (
                filteredConditions.map(condition => (
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
