import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { salesRepsApi } from '@/api/salesReps'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import type { SalesRep } from '@/types/database'

export default function SalesRepForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState<Partial<SalesRep>>({
    active: true,
    nickname: '',
    legal_name: '',
    document: '',
    phone: '',
    city: '',
    state: '',
    regions: []
  })

  const [newRegion, setNewRegion] = useState('')

  const { data: rep, isLoading } = useQuery({
    queryKey: ['salesRep', id],
    queryFn: () => salesRepsApi.getSalesRep(id!),
    enabled: isEditing
  })

  useEffect(() => {
    if (rep) {
      setFormData(rep)
    }
  }, [rep])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SalesRep>) => {
      if (isEditing) return salesRepsApi.updateSalesRep(id!, data)
      return salesRepsApi.createSalesRep(data as any)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Representante atualizado com sucesso!' : 'Representante criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['salesReps'] })
      navigate('/cadastros/representantes')
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar representante: ${e.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nickname) {
      toast.error('O apelido/nome é obrigatório')
      return
    }
    saveMutation.mutate(formData)
  }

  const addRegion = () => {
    if (!newRegion.trim()) return
    setFormData(prev => ({
      ...prev,
      regions: [...(prev.regions || []), newRegion.trim()]
    }))
    setNewRegion('')
  }

  const removeRegion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions?.filter((_, i) => i !== index)
    }))
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando representante...</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/representantes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {isEditing ? 'Editar Representante' : 'Novo Representante'}
          </h1>
          <p className="text-muted-foreground text-sm">Preencha os dados do representante e as regiões de atuação.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        
        {/* Basic Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome Fantasia / Apelido *</label>
            <Input
              required
              value={formData.nickname || ''}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="Como é conhecido"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Razão Social</label>
            <Input
              value={formData.legal_name || ''}
              onChange={e => setFormData({ ...formData, legal_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CNPJ / CPF</label>
            <Input
              value={formData.document || ''}
              onChange={e => setFormData({ ...formData, document: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade / Município</label>
            <Input
              value={formData.city || ''}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">UF</label>
            <Input
              value={formData.state || ''}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              maxLength={2}
            />
          </div>
        </div>

        {/* Regions */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-medium mb-4">Regiões Atendidas</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da região..."
                value={newRegion}
                onChange={e => setNewRegion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRegion()
                  }
                }}
              />
              <Button type="button" onClick={addRegion} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.regions?.map((reg, index) => (
                <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  <span>{reg}</span>
                  <button
                    type="button"
                    onClick={() => removeRegion(index)}
                    className="hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(!formData.regions || formData.regions.length === 0) && (
                <span className="text-sm text-muted-foreground italic">Nenhuma região adicionada ainda.</span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
            <span className="text-sm font-medium">Representante Ativo</span>
          </label>

          <Button type="submit" disabled={saveMutation.isPending} className="shadow-lg shadow-primary/20">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Representante'}
          </Button>
        </div>
      </form>
    </div>
  )
}
