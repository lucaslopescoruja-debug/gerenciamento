import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Building2, MapPin, Phone, Wallet, Briefcase } from 'lucide-react'
import { customersApi } from '@/api/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    active: true,
    nickname: '',
    document_type: 'CNPJ' as 'CPF' | 'CNPJ',
    document: '',
    fantasy_name: '',
    legal_name: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    po_box: '',
    city: '',
    state: '',
    phone1: '',
    phone2: '',
    phone3: '',
    phone4: '',
    email: '',
    credit_limit: 0,
    price_table: '',
    sales_rep: '',
    payment_condition: '',
    allow_unit_price_change: false,
    region: ''
  })

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: isEditing
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        active: customer.active ?? true,
        nickname: customer.nickname || '',
        document_type: customer.document_type || 'CNPJ',
        document: customer.document || '',
        fantasy_name: customer.fantasy_name || '',
        legal_name: customer.legal_name || '',
        cep: customer.cep || '',
        address: customer.address || '',
        number: customer.number || '',
        complement: customer.complement || '',
        neighborhood: customer.neighborhood || '',
        po_box: customer.po_box || '',
        city: customer.city || '',
        state: customer.state || '',
        phone1: customer.phone1 || '',
        phone2: customer.phone2 || '',
        phone3: customer.phone3 || '',
        phone4: customer.phone4 || '',
        email: customer.email || '',
        credit_limit: customer.credit_limit || 0,
        price_table: customer.price_table || '',
        sales_rep: customer.sales_rep || '',
        payment_condition: customer.payment_condition || '',
        allow_unit_price_change: customer.allow_unit_price_change || false,
        region: customer.region || ''
      })
    }
  }, [customer])

  const mutation = useMutation({
    mutationFn: (data: any) => isEditing ? customersApi.updateCustomer(id!, data) : customersApi.createCustomer(data),
    onSuccess: () => {
      toast.success(`Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate('/cadastros/clientes')
    },
    onError: (e: any) => {
      toast.error(`Erro: ${e.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }))
          toast.success('Endereço preenchido pelo CEP')
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados cadastrais da empresa/cliente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dados Principais */}
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            Dados Principais
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Apelido *</label>
              <Input 
                required 
                value={formData.nickname} 
                onChange={e => setFormData({...formData, nickname: e.target.value})} 
                placeholder="Ex: MERCADO RODRIGUES"
              />
            </div>
            <div className="md:col-span-4 flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                />
                <span className="font-bold text-sm">Cliente Ativo</span>
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Tipo Doc</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.document_type}
                onChange={e => setFormData({...formData, document_type: e.target.value as any})}
              >
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{formData.document_type}</label>
              <Input 
                value={formData.document} 
                onChange={e => setFormData({...formData, document: e.target.value})} 
                placeholder={formData.document_type === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
              />
            </div>

            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Nome Fantasia</label>
              <Input 
                value={formData.fantasy_name} 
                onChange={e => setFormData({...formData, fantasy_name: e.target.value})} 
              />
            </div>

            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Razão Social</label>
              <Input 
                value={formData.legal_name} 
                onChange={e => setFormData({...formData, legal_name: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="glass-card p-6 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <MapPin className="h-5 w-5 text-emerald-500" />
            Endereço
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">CEP</label>
              <Input 
                value={formData.cep} 
                onChange={e => setFormData({...formData, cep: e.target.value})} 
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Endereço (Logradouro)</label>
              <Input 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Número</label>
              <Input 
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})} 
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Complemento</label>
              <Input 
                value={formData.complement} 
                onChange={e => setFormData({...formData, complement: e.target.value})} 
                placeholder="Sala, Apto, Galpão, KM..."
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bairro</label>
              <Input 
                value={formData.neighborhood} 
                onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Caixa Postal</label>
              <Input 
                value={formData.po_box} 
                onChange={e => setFormData({...formData, po_box: e.target.value})} 
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Município</label>
              <Input 
                value={formData.city} 
                onChange={e => setFormData({...formData, city: e.target.value})} 
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">UF</label>
              <Input 
                value={formData.state} 
                onChange={e => setFormData({...formData, state: e.target.value})} 
                maxLength={2}
                className="uppercase text-center"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="glass-card p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Phone className="h-5 w-5 text-blue-500" />
            Contato
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Telefone 1</label>
              <Input value={formData.phone1} onChange={e => setFormData({...formData, phone1: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Telefone 2</label>
              <Input value={formData.phone2} onChange={e => setFormData({...formData, phone2: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Telefone 3</label>
              <Input value={formData.phone3} onChange={e => setFormData({...formData, phone3: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Telefone 4</label>
              <Input value={formData.phone4} onChange={e => setFormData({...formData, phone4: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">E-mail</label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Dados de Venda */}
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Briefcase className="h-5 w-5 text-purple-500" />
            Dados de Venda / Financeiro
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Limite de Crédito (R$)
              </label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.credit_limit} 
                onChange={e => setFormData({...formData, credit_limit: parseFloat(e.target.value) || 0})} 
              />
            </div>
            
            <div className="md:col-span-8">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Tabela de Preços</label>
              <Input 
                value={formData.price_table} 
                onChange={e => setFormData({...formData, price_table: e.target.value})} 
                placeholder="Ex: 01 - TABELA GERAL"
              />
            </div>

            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Representante / Vendedor</label>
              <Input 
                value={formData.sales_rep} 
                onChange={e => setFormData({...formData, sales_rep: e.target.value})} 
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Condição de Pagamento</label>
              <Input 
                value={formData.payment_condition} 
                onChange={e => setFormData({...formData, payment_condition: e.target.value})} 
                placeholder="Ex: 30 DDL"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Região</label>
              <Input 
                value={formData.region} 
                onChange={e => setFormData({...formData, region: e.target.value})} 
              />
            </div>

            <div className="md:col-span-4 flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.allow_unit_price_change} 
                  onChange={e => setFormData({...formData, allow_unit_price_change: e.target.checked})}
                  className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                />
                <span className="font-bold text-sm">Alterar valor unitário</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 z-10 bg-background/80 p-4 backdrop-blur-md rounded-xl border border-border/50 shadow-lg">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" className="min-w-[150px] shadow-lg shadow-primary/20" disabled={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
