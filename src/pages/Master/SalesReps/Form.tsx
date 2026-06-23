import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { salesRepsApi } from '@/api/salesReps'
import { regionsApi } from '@/api/regions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import type { SalesRep } from '@/types/database'
import { usersApi } from '@/api/users'


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
    commission_rate: 0,
    monthly_goal: 0
  })

  const [regionIds, setRegionIds] = useState<string[]>([])
  
  // Create User State
  const [createLogin, setCreateLogin] = useState(false)
  const [username, setUsername] = useState('')

  const { data: availableRegions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: regionsApi.getRegions
  })

  const { data: rep, isLoading } = useQuery({
    queryKey: ['salesRep', id],
    queryFn: () => salesRepsApi.getSalesRep(id!),
    enabled: isEditing
  })

  useEffect(() => {
    if (rep) {
      setFormData({
        active: rep.active ?? true,
        nickname: rep.nickname || '',
        legal_name: rep.legal_name || '',
        document: rep.document || '',
        phone: rep.phone || '',
        city: rep.city || '',
        state: rep.state || '',
        commission_rate: rep.commission_rate || 0,
        monthly_goal: rep.monthly_goal || 0
      })
      if (rep.sales_rep_regions) {
        setRegionIds(rep.sales_rep_regions.map((sr: any) => sr.regions?.id).filter(Boolean))
      }
    }
  }, [rep])

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SalesRep>) => {
      // Create user if requested
      if (!isEditing && createLogin && username) {
        await usersApi.createUser({
          name: data.nickname || data.legal_name || 'Vendedor',
          username: username,

          role: 'vendedor',
          permissions: {
            can_view_dashboard: false,
            can_manage_loads: false,
            can_do_conference: false,
            can_manage_products: false,
            can_manage_users: false,
            can_do_delivery: false
          },
          active: true
        })
      }

      if (isEditing) return salesRepsApi.updateSalesRep(id!, data, regionIds)
      return salesRepsApi.createSalesRep(data as any, regionIds)
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
    if (!isEditing && createLogin && !username) {
      toast.error('Informe o usuário de login para o vendedor')
      return
    }
    saveMutation.mutate(formData)
  }

  const toggleRegion = (regionId: string) => {
    setRegionIds(prev => 
      prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId]
    )
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Comissão (%)</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.commission_rate || ''}
                onChange={e => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                className="pl-8"
              />
              <span className="absolute left-3 top-2.5 text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Meta de Vendas (Mensal)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_goal || ''}
                onChange={e => setFormData({ ...formData, monthly_goal: parseFloat(e.target.value) || 0 })}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* User Account Creation */}
        {!isEditing && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-lg font-medium mb-4">Acesso ao Aplicativo</h3>
            <div className="space-y-4 max-w-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  checked={createLogin}
                  onChange={e => setCreateLogin(e.target.checked)}
                />
                <span className="text-sm font-medium">Criar login de Vendedor?</span>
              </label>
              
              {createLogin && (
                <div className="space-y-2 pl-6 animate-in slide-in-from-top-2">
                  <label className="text-sm font-medium">Usuário de Login *</label>
                  <Input
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ex: joao.vendedor"
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha inicial será <strong>Trocar@123</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regions */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-medium mb-4">Regiões Atendidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableRegions.map(region => (
              <label key={region.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  checked={regionIds.includes(region.id)}
                  onChange={() => toggleRegion(region.id)}
                />
                <span className="text-sm font-medium select-none">{region.name}</span>
              </label>
            ))}
            {availableRegions.length === 0 && (
              <span className="text-sm text-muted-foreground italic col-span-full">Nenhuma região cadastrada no sistema. Vá em Cadastros &gt; Regiões para adicionar.</span>
            )}
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
