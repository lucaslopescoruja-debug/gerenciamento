import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { regionsApi } from '@/api/regions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'

export default function RegionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    active: true,
    name: ''
  })

  const { data: region, isLoading } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regionsApi.getRegion(id!),
    enabled: isEditing
  })

  useEffect(() => {
    if (region) {
      setFormData({
        active: region.active ?? true,
        name: region.name || ''
      })
    }
  }, [region])

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) return regionsApi.updateRegion(id!, data)
      return regionsApi.createRegion(data)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Região atualizada com sucesso!' : 'Região criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      navigate('/cadastros/regioes')
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar região: ${e.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('O nome da região é obrigatório')
      return
    }
    saveMutation.mutate(formData)
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando região...</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/regioes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {isEditing ? 'Editar Região' : 'Nova Região'}
          </h1>
          <p className="text-muted-foreground text-sm">Preencha os dados da região de atuação.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Região *</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Porto Seguro, Região Sul, etc."
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
            <span className="text-sm font-medium">Região Ativa</span>
          </label>

          <Button type="submit" disabled={saveMutation.isPending} className="shadow-lg shadow-primary/20">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Região'}
          </Button>
        </div>
      </form>
    </div>
  )
}
