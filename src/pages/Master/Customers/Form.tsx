import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Building2, MapPin, Phone, Wallet, Briefcase, Plus, Trash2, Box, History, ClipboardList, FileText, Search, RefreshCw } from 'lucide-react'
import { customersApi } from '@/api/customers'
import { salesRepsApi } from '@/api/salesReps'
import { regionsApi } from '@/api/regions'
import { priceTablesApi } from '@/api/priceTables'
import { salesApi } from '@/api/sales'
import { equipmentsApi } from '@/api/equipments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'
import { geocodeAddress } from '@/api/routing'
import { generateContractPDF } from '@/utils/pdf'
import { isValidCPFOrCNPJ, formatDocument } from '@/utils/documentValidation'

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, company, hasPermission } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  
  const isEditing = Boolean(id)

  const [isGeocoding, setIsGeocoding] = useState(false)
  const [comodatoTab, setComodatoTab] = useState<'atuais' | 'historico' | 'os'>('atuais')

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
    latitude: '',
    longitude: '',
    phone1: '',
    phone2: '',
    phone3: '',
    phone4: '',
    email: '',
    credit_limit: 0,
    price_table_id: '',
    sales_rep_id: '',
    payment_condition_ids: [] as string[],
    allow_unit_price_change: false,
    region_id: '',
    equipments: [] as any[]
  })

  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesReps'],
    queryFn: salesRepsApi.getSalesReps
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: regionsApi.getRegions
  })

  const { data: priceTables = [] } = useQuery({
    queryKey: ['priceTables'],
    queryFn: priceTablesApi.getPriceTables
  })

  const { data: paymentConditions = [] } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: salesApi.getPaymentConditions
  })

  const { data: customerConditions = [] } = useQuery({
    queryKey: ['customer_payment_conditions', id],
    queryFn: () => salesApi.getCustomerPaymentConditions(id!),
    enabled: isEditing
  })

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: isEditing
  })

  const { data: currentEquipments = [] } = useQuery({
    queryKey: ['customer_equipments', id],
    queryFn: () => equipmentsApi.getCustomerEquipments(id!),
    enabled: isEditing
  })

  const { data: customerHistory = [] } = useQuery({
    queryKey: ['customer_equipment_history', id],
    queryFn: () => equipmentsApi.getCustomerEquipmentsHistory(id!),
    enabled: isEditing
  })

  const { data: customerOrders = [] } = useQuery({
    queryKey: ['customer_orders', id],
    queryFn: () => equipmentsApi.getCustomerOrders(id!),
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
        latitude: customer.latitude ? customer.latitude.toString() : '',
        longitude: customer.longitude ? customer.longitude.toString() : '',
        phone1: customer.phone1 || '',
        phone2: customer.phone2 || '',
        phone3: customer.phone3 || '',
        phone4: customer.phone4 || '',
        email: customer.email || '',
        credit_limit: customer.credit_limit || 0,
        price_table_id: customer.price_table_id || '',
        payment_condition_ids: customerConditions.map(c => c.payment_condition_id),
        allow_unit_price_change: customer.allow_unit_price_change || false,
        region_id: customer.region_id || '',
        sales_rep_id: customer.sales_rep_id || '',
        equipments: customer.equipments || []
      })
    }
  }, [customer, customerConditions])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.document && data.document.trim() !== '') {
        const docTrimmed = data.document.trim()
        const isDuplicate = await customersApi.checkDocumentExists(docTrimmed, isEditing ? id : undefined)
        if (isDuplicate) {
          throw new Error('Já existe um cliente cadastrado com este CPF/CNPJ.')
        }
      }

      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null
      }
      const { payment_condition_ids, equipments, ...customerData } = payload
      const result = isEditing ? await customersApi.updateCustomer(id!, customerData) : await customersApi.createCustomer(customerData)
      await salesApi.setCustomerPaymentConditions(result.id, payment_condition_ids)
      return result
    },
    onSuccess: () => {
      toast.success(`Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer_payment_conditions'] })
      navigate('/cadastros/clientes')
    },
    onError: (e: any) => {
      toast.error(`Erro: ${e.message}`)
    }
  })

  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  const handleFetchCnpj = async () => {
    if (formData.document_type !== 'CNPJ') return;
    const cnpj = formData.document.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      toast.error('CNPJ inválido para consulta');
      return;
    }
    
    setIsFetchingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const data = await res.json();
      
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          legal_name: data.razao_social || prev.legal_name,
          fantasy_name: data.nome_fantasia || data.razao_social || prev.fantasy_name,
          nickname: !prev.nickname ? (data.nome_fantasia || data.razao_social) : prev.nickname,
          cep: data.cep ? data.cep.replace('.', '') : prev.cep,
          address: data.logradouro || prev.address,
          number: data.numero || prev.number,
          complement: data.complemento || prev.complement,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.municipio || prev.city,
          state: data.uf || prev.state,
          phone1: data.ddd_telefone_1 || prev.phone1
        }));
        toast.success('Dados da empresa preenchidos!');
      } else {
        toast.error('Erro ao consultar CNPJ: ' + (data.message || 'Desconhecido'));
      }
    } catch (err) {
      toast.error('Erro de conexão ao consultar CNPJ');
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.document && !isValidCPFOrCNPJ(formData.document)) {
      toast.error('O número de CNPJ ou CPF informado é inválido.')
      return
    }

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

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipments: [
        ...prev.equipments,
        { description: '', serial_number: '', delivered_at: new Date().toISOString().split('T')[0], status: 'active', notes: '' }
      ]
    }))
  }

  const removeEquipment = (index: number) => {
    setFormData(prev => {
      const arr = [...prev.equipments]
      arr.splice(index, 1)
      return { ...prev, equipments: arr }
    })
  }

  const updateEquipment = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const arr = [...prev.equipments]
      arr[index] = { ...arr[index], [field]: value }
      return { ...prev, equipments: arr }
    })
  }

  const hasAccess = hasPermission('can_manage_customers') || !isManager

  if (!hasAccess) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>
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
        <fieldset className="space-y-6" disabled={!isManager}>
        
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
              <div className="flex gap-2">
                <Input 
                  value={formData.document} 
                  onChange={e => setFormData({...formData, document: formatDocument(e.target.value, formData.document_type)})} 
                  placeholder={formData.document_type === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                />
                {formData.document_type === 'CNPJ' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFetchCnpj} 
                    disabled={isFetchingCnpj}
                  >
                    {isFetchingCnpj ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    {isFetchingCnpj ? '' : 'Consultar'}
                  </Button>
                )}
              </div>
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
            <div className="md:col-span-12 mt-2 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Coordenadas Geográficas (Latitude e Longitude)
                </label>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  disabled={isGeocoding || !formData.address || !formData.city}
                  onClick={async () => {
                    setIsGeocoding(true)
                    try {
                      const fullAddress = `${formData.address}, ${formData.number || ''}, ${formData.neighborhood || ''}, ${formData.city} - ${formData.state}`.replace(/,\s*,/g, ',').trim()
                      const coords = await geocodeAddress(fullAddress)
                      if (coords) {
                        setFormData({...formData, latitude: coords.lat.toString(), longitude: coords.lng.toString()})
                        toast.success('Coordenadas localizadas com sucesso!')
                      } else {
                        toast.error('Não foi possível localizar este endereço.')
                      }
                    } catch (e) {
                      toast.error('Erro na busca de coordenadas.')
                    } finally {
                      setIsGeocoding(false)
                    }
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isGeocoding ? 'Buscando...' : 'Localizar a partir do Endereço'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Latitude</label>
                  <Input 
                    value={formData.latitude} 
                    onChange={e => setFormData({...formData, latitude: e.target.value})} 
                    placeholder="-23.5505"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Longitude</label>
                  <Input 
                    value={formData.longitude} 
                    onChange={e => setFormData({...formData, longitude: e.target.value})} 
                    placeholder="-46.6333"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
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
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.price_table_id || ''}
                onChange={e => setFormData({...formData, price_table_id: e.target.value})}
              >
                <option value="">Selecione uma tabela...</option>
                {priceTables.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Representante / Vendedor</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.sales_rep_id}
                onChange={e => {
                  setFormData({...formData, sales_rep_id: e.target.value})
                }}
              >
                <option value="">Selecione um representante...</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.nickname} {rep.regions?.length ? `(${rep.regions.join(', ')})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-8">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Condições de Pagamento Permitidas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {paymentConditions.length === 0 && <span className="text-sm text-muted-foreground">Nenhuma condição cadastrada.</span>}
                {paymentConditions.map(pc => (
                  <label key={pc.id} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.payment_condition_ids.includes(pc.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, payment_condition_ids: [...prev.payment_condition_ids, pc.id] }))
                        } else {
                          setFormData(prev => ({ ...prev, payment_condition_ids: prev.payment_condition_ids.filter(id => id !== pc.id) }))
                        }
                      }}
                      className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{pc.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Região</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.region_id || ''}
                onChange={e => setFormData({...formData, region_id: e.target.value})}
              >
                <option value="">Selecione uma região...</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
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

        {/* Comodatos / Equipamentos */}
        {isEditing && (
          <div className="glass-card p-6 border-t-4 border-t-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Box className="h-5 w-5 text-orange-500" />
                Comodatos do Cliente
              </div>
            </div>

            <div className="flex border-b mb-4 gap-2">
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${comodatoTab === 'atuais' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setComodatoTab('atuais')}
              >
                <Box className="h-4 w-4 inline mr-1" /> Equipamentos Atuais
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${comodatoTab === 'historico' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setComodatoTab('historico')}
              >
                <History className="h-4 w-4 inline mr-1" /> Histórico de Movimentações
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${comodatoTab === 'os' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setComodatoTab('os')}
              >
                <ClipboardList className="h-4 w-4 inline mr-1" /> Ordens de Serviço
              </button>
            </div>
            
            <div className="space-y-4">
              {comodatoTab === 'atuais' && (
                currentEquipments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                    Nenhum equipamento em comodato registrado para este cliente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentEquipments.map((eq: any) => {
                      const latestPdfOrder = customerOrders
                        .filter((o: any) => o.equipment_id === eq.id && (o.type === 'entrega' || o.type === 'troca'))
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                      return (
                        <div key={eq.id} className="p-4 bg-background/50 border border-border/50 rounded-xl relative group flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-muted-foreground font-mono">{eq.patrimony}</div>
                              <div className="font-bold">{eq.type} {eq.model}</div>
                              {eq.size && <div className="text-sm text-muted-foreground">{eq.size}</div>}
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700`}>
                              Com o Cliente
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-border/50">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (latestPdfOrder) {
                                  try {
                                    // Inject current customer and equipment data since getCustomerOrders doesn't fetch customer details
                                    const enrichedOrder = {
                                      ...latestPdfOrder,
                                      customer: customer,
                                      equipment: eq
                                    };
                                    await generateContractPDF(enrichedOrder, company);
                                  } catch (error: any) {
                                    toast.error(error.message || 'Erro ao gerar o PDF do contrato.');
                                  }
                                } else {
                                  toast.error('Nenhuma OS de entrega/troca encontrada para este equipamento.');
                                }
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Contrato Assinado
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {comodatoTab === 'historico' && (
                customerHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                    Nenhum histórico de comodato.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {customerHistory.map(h => (
                      <div key={h.id} className="border p-3 rounded bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-sm">{h.action}</span>
                            <div className="text-xs text-muted-foreground">{h.equipment?.patrimony} - {h.equipment?.model} ({h.equipment?.type})</div>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        {h.notes && <div className="text-sm mt-2 text-muted-foreground">{h.notes}</div>}
                        <div className="text-xs mt-1">Por: {h.user?.name || 'Sistema'}</div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {comodatoTab === 'os' && (
                customerOrders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                    Nenhuma Ordem de Serviço encontrada.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {customerOrders.map(order => (
                      <div key={order.id} className="border p-3 rounded bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black">#{order.os_number || '---'}</span>
                            <span className="font-bold text-sm uppercase text-muted-foreground">{order.type}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.status === 'concluido' ? 'bg-green-100 text-green-700' :
                              order.status === 'em_rota' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Equipamento: {order.equipment?.patrimony} - {order.equipment?.model}</div>
                        {order.driver && <div className="text-xs mt-1">Resp: {order.driver.name}</div>}
                        {order.defect_description && <div className="text-sm mt-2 text-muted-foreground line-clamp-2">Defeito: {order.defect_description}</div>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
        </fieldset>

        <div className="flex justify-end gap-3 sticky bottom-4 z-10 bg-background/80 p-4 backdrop-blur-md rounded-xl border border-border/50 shadow-lg">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
          {isManager && (
            <Button type="submit" className="min-w-[150px] shadow-lg shadow-primary/20" disabled={mutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
