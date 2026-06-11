import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Save, Banknote } from 'lucide-react'

export default function PaymentConditionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [name, setName] = useState('')
  const [installments, setInstallments] = useState(1)

  const { data: conditions } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: salesApi.getPaymentConditions,
    enabled: isEditing
  })

  useEffect(() => {
    if (isEditing && conditions) {
      const condition = conditions.find(c => c.id === id)
      if (condition) {
        setName(condition.name)
        setInstallments(condition.installments)
      }
    }
  }, [id, isEditing, conditions])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { name, installments, active: true }
      if (isEditing) {
        return salesApi.updatePaymentCondition(id!, payload)
      } else {
        return salesApi.createPaymentCondition(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_conditions'] })
      toast.success(isEditing ? 'Condição atualizada' : 'Condição criada')
      navigate('/cadastros/condicoes-pagamento')
    },
    onError: (e: any) => toast.error(`Erro: ${e.message}`)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Preencha o nome da condição')
    if (installments < 1) return toast.error('O número de parcelas deve ser maior que 0')
    mutation.mutate()
  }

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/cadastros/condicoes-pagamento">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Banknote className="h-6 w-6 text-primary" />
            {isEditing ? 'Editar Condição' : 'Nova Condição de Pagamento'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados abaixo para configurar esta condição.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Condição *</Label>
                <Input 
                  placeholder="Ex: 28 Dias Boleto" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Quantidade de Parcelas *</Label>
                <Input 
                  type="number"
                  min="1"
                  placeholder="Ex: 1" 
                  value={installments}
                  onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                  required
                />
                <p className="text-xs text-muted-foreground">Opcional: Informe o número de faturas geradas nesta condição.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link to="/cadastros/condicoes-pagamento">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={mutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Condição'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
