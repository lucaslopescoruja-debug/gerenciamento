import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Users, UploadCloud, ArrowUpDown, ArrowUp, ArrowDown, Key } from 'lucide-react'
import Papa from 'papaparse'
import { salesRepsApi } from '@/api/salesReps'
import { usersApi } from '@/api/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function SalesRepsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'
  const [isImporting, setIsImporting] = useState(false)
  const [isCreatingUsers, setIsCreatingUsers] = useState(false)

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ['salesReps'],
    queryFn: salesRepsApi.getSalesReps
  })

  // deleteMutation removed because SalesReps are managed via Users

  const importMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      for (const rep of payload) {
        await salesRepsApi.createSalesRep(rep)
      }
    },
    onSuccess: () => {
      toast.success('Representantes importados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['salesReps'] })
      setIsImporting(false)
    },
    onError: (e: any) => {
      toast.error(`Erro ao importar: ${e.message}`)
      setIsImporting(false)
    }
  })

  const createUsersMutation = useMutation({
    mutationFn: async () => {
      setIsCreatingUsers(true)
      const allUsers = await usersApi.getUsers()
      const existingEmails = new Set(allUsers.map(u => u.username.toLowerCase()))
      
      let created = 0;
      for (const rep of reps) {
        const name = (rep.nickname || rep.legal_name || 'Vendedor').trim()
        
        let baseEmail = name.split(' ')[0].toLowerCase()
        baseEmail = baseEmail.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '')
        const emailLogin = `${baseEmail}@delicius.com`

        if (!existingEmails.has(emailLogin)) {
          await usersApi.createUser({
            name: name,
            username: emailLogin,
            role: 'vendedor',
            permissions: {
              can_view_dashboard: true,
              can_manage_loads: false,
              can_do_delivery: false,
              can_do_conference: false,
              can_manage_products: true,
              can_manage_price_tables: true,
              can_manage_payment_conditions: false,
              can_manage_customers: true,
              can_manage_reps: false,
              can_manage_regions: false,
              can_manage_integrations: false,
              can_manage_equipments: true,
              can_manage_os: true,
              can_use_sales_app: true,
              can_manage_sales: false,
              can_manage_users: false,
              can_manage_supplies: false,
              can_request_supplies: false
            },
            active: true
          })
          created++;
          existingEmails.add(emailLogin)
        }
      }
      return created;
    },
    onSuccess: (count) => {
      toast.success(`${count} logins de vendedores criados com sucesso!`)
      setIsCreatingUsers(false)
    },
    onError: (e: any) => {
      toast.error(`Erro ao criar logins: ${e.message}`)
      setIsCreatingUsers(false)
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const payload = results.data.map((row: any) => ({
            nickname: row['Apelido'] || '',
            legal_name: row['Razão social/Nome'] || '',
            document: row['CNPJ/CPF'] || '',
            phone: row['Telefone 1'] || '',
            city: row['Município'] || '',
            state: row['UF'] || '',
            active: true
          }))
          
          if (payload.length === 0) {
            toast.error('O arquivo parece estar vazio ou no formato incorreto.')
            setIsImporting(false)
            return
          }

          importMutation.mutate(payload)
        } catch (e: any) {
          toast.error('Erro ao ler a planilha.')
          setIsImporting(false)
        }
      },
      error: (e) => {
        toast.error(`Erro ao processar arquivo: ${e.message}`)
        setIsImporting(false)
      }
    })
  }

  // handleDelete removed

  const filteredReps = useMemo(() => {
    return reps.filter(r => {
      const s = searchTerm.toLowerCase()
      return (
        (r.nickname || '').toLowerCase().includes(s) ||
        (r.legal_name || '').toLowerCase().includes(s) ||
        (r.document || '').includes(s) ||
        (r.city || '').toLowerCase().includes(s) ||
        (r.sales_rep_regions?.map((sr: any) => sr.regions?.name).join(' ') || '').toLowerCase().includes(s)
      )
    })
  }, [reps, searchTerm])

  type SortFieldType = 'active' | 'nickname' | 'document' | 'city' | 'commission_rate' | 'regions' | null
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

  const sortedReps = useMemo(() => {
    const sorted = [...filteredReps]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'active': valA = a.active ? 1 : 0; valB = b.active ? 1 : 0; break;
        case 'nickname': valA = a.nickname || a.legal_name; valB = b.nickname || b.legal_name; break;
        case 'document': valA = a.document; valB = b.document; break;
        case 'city': valA = a.city; valB = b.city; break;
        case 'commission_rate': valA = a.commission_rate || 0; valB = b.commission_rate || 0; break;
        case 'regions': 
          valA = a.sales_rep_regions?.map((sr: any) => sr.regions?.name).join(' '); 
          valB = b.sales_rep_regions?.map((sr: any) => sr.regions?.name).join(' '); 
          break;
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
  }, [filteredReps, sortField, sortAsc])

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Representantes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a equipe de vendas e suas regiões.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isManager && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto shadow-sm text-indigo-500 hover:text-indigo-600 border-indigo-200" 
              disabled={isCreatingUsers} 
              onClick={() => {
                if (window.confirm('Isto irá criar logins automaticamente (nome@delicius.com) para todos os representantes que ainda não tem acesso. Deseja continuar?')) {
                  createUsersMutation.mutate()
                }
              }}
            >
              <Key className="mr-2 h-4 w-4" /> 
              {isCreatingUsers ? 'Criando...' : 'Gerar Logins de Acesso'}
            </Button>
          )}

          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <Users className="h-4 w-4" />
            <span>Para adicionar um novo representante, crie um usuário com a função de <strong>Vendedor</strong> em <Link to="/configuracoes" className="underline font-semibold hover:text-amber-800">Configurações</Link>.</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou região..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('active')}>
                  Status {renderSortIcon('active')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('nickname')}>
                  Apelido / Nome {renderSortIcon('nickname')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('document')}>
                  Documento {renderSortIcon('document')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('city')}>
                  Município/UF {renderSortIcon('city')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('commission_rate')}>
                  Comissão {renderSortIcon('commission_rate')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('regions')}>
                  Regiões Atendidas {renderSortIcon('regions')}
                </th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando representantes...</td></tr>
              ) : sortedReps.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum representante encontrado.</td></tr>
              ) : (
                sortedReps.map(rep => (
                  <tr key={rep.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rep.active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {rep.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{rep.nickname || '-'}</div>
                      <div className="text-xs text-muted-foreground">{rep.legal_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{rep.document || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {rep.city ? `${rep.city}${rep.state ? `/${rep.state}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {rep.commission_rate ? `${rep.commission_rate}%` : '0%'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {rep.sales_rep_regions && rep.sales_rep_regions.length > 0 ? (
                          rep.sales_rep_regions.map((sr: any, idx: number) => (
                            <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                              {sr.regions?.name || '-'}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/representantes/${rep.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled
                          title="Para excluir, desative o usuário correspondente em Configurações > Usuários"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-not-allowed opacity-50"
                        >
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
        
        <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
          <span>Total: <strong>{sortedReps.length}</strong> representantes</span>
        </div>
      </div>
    </div>
  )
}
