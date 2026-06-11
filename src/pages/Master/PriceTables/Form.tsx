import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { priceTablesApi } from '@/api/priceTables'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'

export default function PriceTableForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    active: true,
    name: ''
  })

  const { data: priceTable, isLoading } = useQuery({
    queryKey: ['priceTable', id],
    queryFn: () => priceTablesApi.getPriceTable(id!),
    enabled: isEditing
  })

  useEffect(() => {
    if (priceTable) {
      setFormData({
        active: priceTable.active ?? true,
        name: priceTable.name || ''
      })
    }
  }, [priceTable])

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) return priceTablesApi.updatePriceTable(id!, data)
      return priceTablesApi.createPriceTable(data)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Tabela de preço atualizada com sucesso!' : 'Tabela de preço criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['priceTables'] })
      navigate('/cadastros/tabelas-de-preco')
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar tabela de preço: ${e.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('O nome da tabela é obrigatório')
      return
    }
    saveMutation.mutate(formData)
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando tabela de preço...</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/tabelas-de-preco')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {isEditing ? 'Editar Tabela de Preço' : 'Nova Tabela de Preço'}
          </h1>
          <p className="text-muted-foreground text-sm">Preencha os dados da tabela de preço.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Tabela *</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tabela Geral, Tabela Atacado, etc."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
            <span className="text-sm font-medium">Tabela Ativa</span>
          </label>

          <Button type="submit" disabled={saveMutation.isPending} className="shadow-lg shadow-primary/20">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Tabela'}
          </Button>
        </div>
      </form>
    </div>
  )
}
