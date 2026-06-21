import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Map, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { regionsApi } from '@/api/regions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function RegionsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: regionsApi.getRegions
  })

  const deleteMutation = useMutation({
    mutationFn: regionsApi.deleteRegion,
    onSuccess: () => {
      toast.success('Região removida com sucesso')
      queryClient.invalidateQueries({ queryKey: ['regions'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover região: ${e.message}`)
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a região "${name}"?. Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(id)
    }
  }

  const filteredRegions = useMemo(() => {
    return regions.filter(r => {
      const s = searchTerm.toLowerCase()
      return (r.name || '').toLowerCase().includes(s)
    })
  }, [regions, searchTerm])

  type SortFieldType = 'active' | 'name' | null
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

  const sortedRegions = useMemo(() => {
    const sorted = [...filteredRegions]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'active': valA = a.active ? 1 : 0; valB = b.active ? 1 : 0; break;
        case 'name': valA = a.name; valB = b.name; break;
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
  }, [filteredRegions, sortField, sortAsc])

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Map className="h-8 w-8 text-primary" />
            Regiões
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as regiões de atuação dos seus clientes e representantes.</p>
        </div>
        
        <Link to="/cadastros/regioes/nova">
          <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Nova Região
          </Button>
        </Link>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar região..."
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
                <th className="px-4 py-3 font-medium w-full cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                  Nome da Região {renderSortIcon('name')}
                </th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Carregando regiões...</td></tr>
              ) : sortedRegions.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhuma região encontrada.</td></tr>
              ) : (
                sortedRegions.map(region => (
                  <tr key={region.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        region.active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {region.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{region.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/regioes/${region.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(region.id, region.name)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
          <span>Total: <strong>{sortedRegions.length}</strong> regiões</span>
        </div>
      </div>
    </div>
  )
}
