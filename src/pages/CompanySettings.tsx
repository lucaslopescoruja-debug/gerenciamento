import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/api/companies'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Building, MapPin, Save, Phone, Mail, FileText, Info, Link, Key, RefreshCw } from 'lucide-react'
import { geocodeAddress } from '@/api/routing'
import { maxiprodApi } from '@/api/maxiprod'
import { backupApi } from '@/api/backup'
import { saasApi } from '@/api/saas'
import { Database, Download, Upload, Crown, Star, CheckCircle2, ArrowUpCircle } from 'lucide-react'

export default function CompanySettings() {
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  
  // Apenas gestores podem editar isso
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company_settings', company?.id],
    queryFn: () => company?.id ? companiesApi.getCompany(company.id) : null,
    enabled: !!company?.id && isManager
  })

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  const [isGeocoding, setIsGeocoding] = useState(false)
  const [erpToken, setErpToken] = useState('')
  const [erpLoading, setErpLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSyncingIds, setIsSyncingIds] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  
  const [erpMoeda, setErpMoeda] = useState('')
  const [erpOperacao, setErpOperacao] = useState('')
  const [erpUnidade, setErpUnidade] = useState('')

  // Backup & Restore
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState('')
  const fileInputRef = import('react').then(m => m.useRef<HTMLInputElement>(null))
  // Resolving useRef synchronously since it's inside component:
  // Actually, we can just use React.useRef. We already import { useState, useEffect, useRef } from 'react' if we add it.

  const [formData, setFormData] = useState({
    name: '',
    fantasy_name: '',
    cnpj: '',
    phone: '',
    email: '',
    garage_cep: '',
    garage_street: '',
    garage_number: '',
    garage_complement: '',
    garage_neighborhood: '',
    garage_city: '',
    garage_state: '',
    garage_lat: '',
    garage_lng: '',
    additional_info: ''
  })

  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        fantasy_name: companyData.fantasy_name || '',
        cnpj: companyData.cnpj || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        garage_cep: companyData.garage_cep || '',
        garage_street: companyData.garage_street || '',
        garage_number: companyData.garage_number || '',
        garage_complement: companyData.garage_complement || '',
        garage_neighborhood: companyData.garage_neighborhood || '',
        garage_city: companyData.garage_city || '',
        garage_state: companyData.garage_state || '',
        garage_lat: companyData.garage_lat ? companyData.garage_lat.toString() : '',
        garage_lng: companyData.garage_lng ? companyData.garage_lng.toString() : '',
        additional_info: companyData.additional_info || ''
      })
      setErpToken(companyData.maxiprod_api_token || '')
      setLastSync(companyData.maxiprod_last_sync || null)
      setErpMoeda(companyData.maxiprod_moeda_id ? companyData.maxiprod_moeda_id.toString() : '')
      setErpOperacao(companyData.maxiprod_operacao_id ? companyData.maxiprod_operacao_id.toString() : '')
      setErpUnidade(companyData.maxiprod_unidade_id ? companyData.maxiprod_unidade_id.toString() : '')
    }
  }, [companyData])

  const handleCepBlur = async () => {
    const cep = formData.garage_cep.replace(/\D/g, '')
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            garage_street: data.logradouro || prev.garage_street,
            garage_neighborhood: data.bairro || prev.garage_neighborhood,
            garage_city: data.localidade || prev.garage_city,
            garage_state: data.uf || prev.garage_state
          }))
          toast.success('Endereço preenchido pelo CEP')
        }
      } catch (e) {
        // ignore
      }
    }
  }

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<typeof companyData>) => {
      if (!company?.id) throw new Error('Empresa não identificada')
      return companiesApi.updateCompany(company.id, updates as any)
    },
    onSuccess: () => {
      toast.success('Dados da empresa atualizados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['company_settings'] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const requestUpgradeMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !user) throw new Error('Dados não encontrados');
      return saasApi.createLead({
        name: user.name || 'Usuário Sistema',
        email: user.email || user.username || 'N/A',
        phone: formData.phone || company?.phone || 'N/A',
        message: `SOLICITAÇÃO DE UPGRADE: A empresa ${company.name || company.fantasy_name} (${company.cnpj || 'CNPJ não inf.'}) deseja conhecer os planos superiores para expandir suas operações. Plano atual: ${(company.plan || 'platina').toUpperCase()}.`
      });
    },
    onSuccess: () => {
      toast.success('Solicitação enviada com sucesso! Nossa equipe comercial entrará em contato em breve para apresentar os benefícios do Upgrade.');
    },
    onError: (err: any) => toast.error(`Erro ao enviar solicitação: ${err.message}`)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      garage_address: `${formData.garage_street}, ${formData.garage_number}, ${formData.garage_neighborhood}, ${formData.garage_city} - ${formData.garage_state}`,
      garage_lat: formData.garage_lat ? parseFloat(formData.garage_lat) : null,
      garage_lng: formData.garage_lng ? parseFloat(formData.garage_lng) : null
    }
    updateMutation.mutate(payload as any)
  }

  async function handleSaveERP() {
    if (!company?.id) return
    setErpLoading(true)
    try {
      await companiesApi.updateCompany(company.id, { 
        maxiprod_api_token: erpToken,
        maxiprod_moeda_id: erpMoeda ? parseInt(erpMoeda) : null,
        maxiprod_operacao_id: erpOperacao ? parseInt(erpOperacao) : null,
        maxiprod_unidade_id: erpUnidade ? parseInt(erpUnidade) : null,
      })
      
      try {
        await maxiprodApi.testConnection()
        toast.success('Configurações do Maxiprod salvas com sucesso!')
      } catch (err: any) {
        toast.error(`Falha na conexão: ${err.message}`)
      }
      
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message)
    } finally {
      setErpLoading(false)
    }
  }

  async function handleSyncIds() {
    if (!erpToken) {
      toast.error('Por favor, salve o token do Maxiprod primeiro.')
      return
    }
    
    setIsSyncingIds(true)
    toast.success('Iniciando Sincronização Leve de IDs...')
    
    try {
      const stats = await maxiprodApi.syncMaxiprodIds()
      toast.success(`Sincronização concluída! IDs atualizados: ${stats.products} produtos, ${stats.customers} clientes.`)
      // Refresh to update last_sync if we had one, but this just gets IDs.
    } catch (err: any) {
      toast.error(`Erro ao sincronizar IDs: ${err.message}`)
    } finally {
      setIsSyncingIds(false)
    }
  }

  async function handleSyncERP() {
    if (!erpToken) {
      toast.error('Por favor, salve o token do Maxiprod primeiro.')
      return
    }
    
    setIsSyncing(true)
    toast.success('Iniciando sincronização com Maxiprod...')
    
    try {
      const res = await maxiprodApi.syncAllData()
      if (res.success) {
        toast.success('Sincronização concluída com sucesso!')
        setLastSync(res.timestamp)
        queryClient.invalidateQueries({ queryKey: ['company_settings'] })
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao sincronizar dados')
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleExportBackup() {
    if (!company?.id) return
    setIsBackingUp(true)
    toast.success('Gerando backup, isso pode levar alguns segundos...', { duration: 5000 })
    try {
      const backupData = await backupApi.generateBackup(company.id)
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${company.slug}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Backup gerado e baixado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar backup')
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !company?.id) return

    setIsRestoring(true)
    setRestoreProgress('Lendo arquivo...')
    
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)
      
      if (!backupData.version || !backupData.companyId || backupData.companyId !== company.id) {
        throw new Error('Arquivo de backup inválido ou pertence a outra empresa.')
      }

      await backupApi.restoreBackup(company.id, backupData, (msg) => {
        setRestoreProgress(msg)
      })

      toast.success('Backup restaurado com sucesso!')
      queryClient.invalidateQueries()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao restaurar backup')
    } finally {
      setIsRestoring(false)
      setRestoreProgress('')
      if (e.target) e.target.value = '' // reset file input
    }
  }

  const planDetails: Record<string, any> = {
    bronze: { name: 'Bronze', desc: 'Funcionalidades Básicas', icon: Star, color: 'text-amber-700 dark:text-amber-600', bg: 'bg-amber-700/10', border: 'border-t-amber-700', perms: ['Dashboard Básico', 'Configurações de Empresa', 'Gestão de Usuários'] },
    prata: { name: 'Prata', desc: 'Gestão de Cargas e Operações', icon: Star, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-t-slate-500', perms: ['Dashboard Básico', 'Configurações de Empresa', 'Módulo de Cargas', 'Controle Operacional'] },
    ouro: { name: 'Ouro', desc: 'Entregas, Rotas e Conferência', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-t-amber-500', perms: ['Módulo de Cargas', 'Módulo de Entregas', 'Acompanhamento de Rotas', 'Comprovantes Digitais'] },
    platina: { name: 'Platina (Premium)', desc: 'Sistema Completo e Ilimitado', icon: Crown, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-t-emerald-500', perms: ['Todos os módulos anteriores', 'Módulo de Vendas (CRM)', 'Cadastros Completos', 'Acesso Total e Ilimitado'] }
  }
  
  const currentPlanKey = (company?.plan || 'platina') as string;
  const activePlan = planDetails[currentPlanKey] || planDetails.platina;

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas gestores podem configurar a empresa.</div>
  }

  if (isLoading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Minha Empresa</h1>
          <p className="text-sm text-muted-foreground">Gerencie os dados e configurações da sua organização</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Plano e Assinatura */}
        <div className={`glass-card p-6 border-t-4 ${activePlan.border}`}>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <activePlan.icon className={`h-6 w-6 ${activePlan.color}`} />
                <h2 className={`text-xl font-bold ${activePlan.color}`}>Plano {activePlan.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{activePlan.desc}</p>
              
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-foreground mb-2">Permissões Atuais:</p>
                {activePlan.perms.map((perm: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className={`h-4 w-4 ${activePlan.color}`} />
                    {perm}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 max-w-xs text-center w-full md:w-auto">
              <h3 className="font-bold text-foreground mb-2">Deseja expandir suas operações?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Faça um upgrade e tenha acesso a roteirização inteligente, gestão de vendas e relatórios avançados.
              </p>
              <Button 
                type="button" 
                onClick={() => requestUpgradeMutation.mutate()}
                disabled={requestUpgradeMutation.isPending || currentPlanKey === 'platina'}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
              >
                {requestUpgradeMutation.isPending ? 'Enviando...' : (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    {currentPlanKey === 'platina' ? 'Você já possui o melhor plano!' : 'Solicitar Upgrade'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dados Principais */}
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Building className="h-5 w-5 text-primary" />
            Dados Principais
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Razão Social *</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">CNPJ</label>
              <Input 
                value={formData.cnpj} 
                onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Nome Fantasia</label>
              <Input 
                value={formData.fantasy_name} 
                onChange={e => setFormData({...formData, fantasy_name: e.target.value})} 
                placeholder="Nome Fantasia"
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
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-2">
                Telefone
              </label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-2">
                E-mail
              </label>
              <Input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="email@empresa.com.br"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Logística & Endereço */}
        <div className="glass-card p-6 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <MapPin className="h-5 w-5 text-emerald-500" />
            Logística e Endereço Base
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-12">
              <p className="text-xs text-muted-foreground mb-2">
                Este endereço será utilizado como o ponto de partida e chegada para a otimização de rotas de entregas da sua frota.
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">CEP</label>
              <Input 
                value={formData.garage_cep} 
                onChange={e => setFormData({...formData, garage_cep: e.target.value})} 
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Endereço (Logradouro)</label>
              <Input 
                value={formData.garage_street} 
                onChange={e => setFormData({...formData, garage_street: e.target.value})} 
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Número</label>
              <Input 
                value={formData.garage_number} 
                onChange={e => setFormData({...formData, garage_number: e.target.value})} 
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Complemento</label>
              <Input 
                value={formData.garage_complement} 
                onChange={e => setFormData({...formData, garage_complement: e.target.value})} 
                placeholder="Galpão, Sala..."
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bairro</label>
              <Input 
                value={formData.garage_neighborhood} 
                onChange={e => setFormData({...formData, garage_neighborhood: e.target.value})} 
              />
            </div>
            <div className="md:col-span-5">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Município</label>
              <Input 
                value={formData.garage_city} 
                onChange={e => setFormData({...formData, garage_city: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">UF</label>
              <Input 
                value={formData.garage_state} 
                onChange={e => setFormData({...formData, garage_state: e.target.value})} 
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
                  disabled={isGeocoding || !formData.garage_street || !formData.garage_city}
                  onClick={async () => {
                    setIsGeocoding(true)
                    try {
                      const fullAddress = `${formData.garage_street}, ${formData.garage_number || ''}, ${formData.garage_neighborhood || ''}, ${formData.garage_city} - ${formData.garage_state}`.replace(/,\s*,/g, ',').trim()
                      const coords = await geocodeAddress(fullAddress)
                      if (coords) {
                        setFormData({...formData, garage_lat: coords.lat.toString(), garage_lng: coords.lng.toString()})
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
                    value={formData.garage_lat} 
                    onChange={e => setFormData({...formData, garage_lat: e.target.value})} 
                    placeholder="-23.5505"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Longitude</label>
                  <Input 
                    value={formData.garage_lng} 
                    onChange={e => setFormData({...formData, garage_lng: e.target.value})} 
                    placeholder="-46.6333"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-12 mt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1">
                Informações Adicionais
              </label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.additional_info}
                onChange={e => setFormData({...formData, additional_info: e.target.value})}
                placeholder="Adicione aqui quaisquer informações adicionais sobre sua empresa."
              />
            </div>
          </div>
        </div>

        {/* Integração ERP */}
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Link className="h-5 w-5 text-purple-500" />
            Integração ERP (Maxiprod)
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure as credenciais da API do Maxiprod para sincronização automática de estoque e pedidos.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Token de Acesso (API Key)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Cole seu Bearer Token aqui..."
                    className="pl-9 h-10"
                    value={erpToken}
                    onChange={e => setErpToken(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveERP} disabled={erpLoading} type="button" className="shrink-0 h-10">
                  {erpLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar ERP
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 mb-4">
                O aplicativo enviará os pedidos para o Maxiprod automaticamente. 
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 p-3 rounded-md border border-border">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Moeda Padrão ID</label>
                  <Input type="number" placeholder="Ex: 1" value={erpMoeda} onChange={e => setErpMoeda(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Operação Fiscal ID</label>
                  <Input type="number" placeholder="Ex: 1" value={erpOperacao} onChange={e => setErpOperacao(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Unidade Medida ID</label>
                  <Input type="number" placeholder="Ex: 1" value={erpUnidade} onChange={e => setErpUnidade(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">1. Mapeamento de IDs</h4>
                  <p className="text-xs text-muted-foreground">
                    Cruza o CNPJ e o Código para salvar os IDs do Maxiprod localmente, sem importar os dados antigos.
                  </p>
                </div>
                <Button variant="default" onClick={handleSyncIds} disabled={isSyncingIds || !erpToken} type="button" className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncingIds ? 'animate-spin' : ''}`} />
                  {isSyncingIds ? 'Sincronizando IDs...' : 'Sincronizar IDs Maxiprod'}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">2. Sincronização Total (Legado)</h4>
                  <p className="text-xs text-muted-foreground">
                    Puxe clientes, produtos e tabelas de preço do Maxiprod para o Estoque Fácil (substitui dados).
                  </p>
                </div>
                <Button variant="outline" onClick={handleSyncERP} disabled={isSyncing || !erpToken} type="button" className="shrink-0 border-purple-200 hover:bg-purple-50 text-purple-700">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Importando Tudo...' : 'Importação Total (Perigoso)'}
                </Button>
              </div>
              {lastSync && (
                <p className="text-[11px] text-muted-foreground mt-2 text-right">
                  Última sincronização: {new Date(lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Backup de Dados */}
        <div className="glass-card p-6 border-t-4 border-t-orange-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Database className="h-5 w-5 text-orange-500" />
            Backup e Restauração de Dados
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte ou importe seus cadastros mestres (Clientes, Produtos, Usuários, etc). O arquivo de backup estará no formato JSON.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="button" 
              variant="default"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleExportBackup} 
              disabled={isBackingUp || isRestoring}
            >
              {isBackingUp ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isBackingUp ? 'Gerando Backup...' : 'Exportar Backup'}
            </Button>

            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleImportBackup}
                disabled={isBackingUp || isRestoring}
              />
              <Button 
                type="button" 
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                disabled={isBackingUp || isRestoring}
              >
                {isRestoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isRestoring ? 'Restaurando...' : 'Importar Backup'}
              </Button>
            </div>
          </div>
          
          {isRestoring && restoreProgress && (
            <p className="text-sm font-medium text-orange-600 mt-4 animate-pulse">
              {restoreProgress}
            </p>
          )}
          
          <p className="text-[11px] text-muted-foreground mt-4">
            Atenção: A restauração fará atualização dos registros (Upsert). Registros com o mesmo identificador serão sobrescritos com as informações do backup para evitar perdas ou duplicações.
          </p>
        </div>

        {/* Floating Finalize Bar */}
        <div className="flex justify-end gap-3 sticky bottom-4 z-10 bg-background/80 p-4 backdrop-blur-md rounded-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <Button type="submit" className="min-w-[200px] shadow-lg shadow-primary/20 h-11 text-base font-bold" disabled={updateMutation.isPending}>
            <Save className="h-5 w-5 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
