import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Search,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  PackageCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success'; icon: typeof Clock }> = {
  pending: { label: 'Aguardando Descarregamento', variant: 'warning', icon: Clock },
  in_progress: { label: 'Conferindo', variant: 'default', icon: PackageCheck },
  completed: { label: 'Finalizada', variant: 'success', icon: CheckCircle2 },
}

const filterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Aguardando' },
  { value: 'in_progress', label: 'Conferindo' },
  { value: 'completed', label: 'Finalizadas' },
]

export default function ReceiptsList() {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('status') || 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'

  const { data: allOperations = [], isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: operationsApi.getOperations,
  })
  
  // Apenas as de recebimento
  const operations = useMemo(() => allOperations.filter(op => op.type === 'RECEIPT'), [allOperations])

  const queryClient = useQueryClient()
  
  const deleteMutation = useMutation({
    mutationFn: operationsApi.deleteOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      toast.success('Recebimento excluído com sucesso')
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`)
    }
  })

  const filtered = useMemo(() => {
    return operations.filter(op => {
      const matchesFilter = filter === 'all' || op.status === filter
      const matchesSearch =
        !search ||
        op.load_number?.toLowerCase().includes(search.toLowerCase()) ||
        op.client_name?.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [operations, filter, search])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando recebimentos...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Recebimentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} recebimentos encontrados
          </p>
        </div>
        {isManager && (
          <Link to="/recebimentos/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Recebimento
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nota ou fornecedor..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                filter === opt.value
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card text-center py-16">
            <Filter className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma operação encontrada.</p>
          </div>
        ) : (
          filtered.map((op, index) => {
            const config = statusConfig[op.status] || statusConfig.pending
            return (
              <Link key={op.id} to={`/conferencia/${op.id}`} className="block group">
                <div className="glass-card glass-card-hover p-4 flex items-center gap-4 slide-up" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    op.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                    op.status === 'in_progress' ? 'bg-violet-500/15 text-violet-400' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>
                    {config && <config.icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-foreground">{op.load_number}</span>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    {op.client_name && (
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground/60">
                        <span>Fornecedor: {op.client_name}</span>
                      </div>
                    )}
                  </div>
                  {isManager && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        if (window.confirm('Tem certeza que deseja excluir?')) deleteMutation.mutate(op.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
