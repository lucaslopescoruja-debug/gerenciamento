import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, Edit2, Trash2, X, DownloadCloud } from 'lucide-react'
import { priceTablesApi } from '@/api/priceTables'
import { productsApi } from '@/api/products'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import type { PriceTableItem } from '@/types/database'

export default function PriceTableForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    active: true,
    code: '',
    name: ''
  })

  // Modal State for Single Item
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({
    product_id: '',
    price: 0,
    discount_percent: 0,
    max_discount_percent: 0,
    commission_percent: 0
  })

  // Modal State for Import By Group
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const { data: priceTable, isLoading } = useQuery({
    queryKey: ['priceTable', id],
    queryFn: () => priceTablesApi.getPriceTable(id!),
    enabled: isEditing
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts
  })

  // Derived groups
  const productGroups = useMemo(() => {
    const groups = new Set<string>()
    products.forEach(p => {
      if (p.group_name) groups.add(p.group_name)
    })
    return Array.from(groups).sort()
  }, [products])

  useEffect(() => {
    if (priceTable) {
      setFormData({
        active: priceTable.active ?? true,
        code: priceTable.code || '',
        name: priceTable.name || ''
      })
    }
  }, [priceTable])

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) return priceTablesApi.updatePriceTable(id!, data)
      return priceTablesApi.createPriceTable(data)
    },
    onSuccess: (data) => {
      toast.success(isEditing ? 'Tabela de preço atualizada!' : 'Tabela de preço criada!')
      queryClient.invalidateQueries({ queryKey: ['priceTables'] })
      if (!isEditing) {
        navigate(`/cadastros/tabelas-de-preco/${data.id}/editar`, { replace: true })
      }
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar tabela: ${e.message}`)
    }
  })

  const saveItemMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingItemId) return priceTablesApi.updatePriceTableItem(editingItemId, data)
      return priceTablesApi.addPriceTableItem({ ...data, price_table_id: id })
    },
    onSuccess: () => {
      toast.success('Item salvo com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['priceTable', id] })
      setIsModalOpen(false)
      setEditingItemId(null)
    },
    onError: (e: any) => {
      toast.error(`Erro ao salvar item: ${e.message}`)
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: priceTablesApi.deletePriceTableItem,
    onSuccess: () => {
      toast.success('Item removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['priceTable', id] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover item: ${e.message}`)
    }
  })

  const bulkImportMutation = useMutation({
    mutationFn: priceTablesApi.bulkAddPriceTableItems,
    onSuccess: (data) => {
      toast.success(`${data.length} produtos importados com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['priceTable', id] })
      setIsImportModalOpen(false)
      setSelectedGroups([])
    },
    onError: (e: any) => {
      toast.error(`Erro ao importar: ${e.message}`)
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

  const handleOpenItemModal = (item?: PriceTableItem) => {
    if (item) {
      setEditingItemId(item.id)
      setItemForm({
        product_id: item.product_id,
        price: item.price,
        discount_percent: item.discount_percent || 0,
        max_discount_percent: item.max_discount_percent || 0,
        commission_percent: (item as any).commission_percent || 0
      })
    } else {
      setEditingItemId(null)
      setItemForm({
        product_id: '',
        price: 0,
        discount_percent: 0,
        max_discount_percent: 0,
        commission_percent: 0
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.product_id) {
      toast.error('Selecione um produto')
      return
    }
    if (itemForm.price <= 0) {
      toast.error('O preço deve ser maior que zero')
      return
    }
    saveItemMutation.mutate(itemForm)
  }

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])
  }

  const handleImportByGroups = () => {
    if (selectedGroups.length === 0) {
      toast.error('Selecione pelo menos um grupo.')
      return
    }
    const currentItems = priceTable?.price_table_items || []
    const existingProductIds = new Set(currentItems.map((i: any) => i.product_id))

    const productsToImport = products.filter(p => p.group_name && selectedGroups.includes(p.group_name) && !existingProductIds.has(p.id))

    if (productsToImport.length === 0) {
      toast.info('Nenhum produto novo encontrado para importar nestes grupos.')
      setIsImportModalOpen(false)
      setSelectedGroups([])
      return
    }

    const payload = productsToImport.map(p => ({
      price_table_id: id,
      product_id: p.id,
      price: 0,
      discount_percent: 0,
      max_discount_percent: 0
    }))

    bulkImportMutation.mutate(payload)
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando tabela de preço...</div>
  }

  const items: PriceTableItem[] = priceTable?.price_table_items || []

  return (
    <div className="space-y-6 slide-in max-w-5xl mx-auto pb-20 relative">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/tabelas-de-preco')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {isEditing ? 'Editar Tabela de Preços' : 'Nova Tabela de Preços'}
          </h1>
          <p className="text-muted-foreground text-sm">Preencha os dados e gerencie os itens desta tabela.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Código</label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: 01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (Nome da Tabela) *</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: TABELA GERAL"
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
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Cabeçalho'}
          </Button>
        </div>
      </form>

      {/* ITEMS SECTION */}
      {isEditing && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10">
            <h2 className="text-lg font-semibold">Produtos/Serviços</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsImportModalOpen(true)} variant="secondary" size="sm" className="shadow-sm hover:scale-105 transition-transform flex-1 sm:flex-auto">
                <DownloadCloud className="h-4 w-4 mr-2" /> Importar por Grupo
              </Button>
              <Button onClick={() => handleOpenItemModal()} size="sm" className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex-1 sm:flex-auto">
                <Plus className="h-4 w-4 mr-2" /> Novo Produto
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium w-24">Código</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Preço</th>
                  <th className="px-4 py-3 font-medium text-center">Desc (%)</th>
                  <th className="px-4 py-3 font-medium text-center">Desc Máx (%)</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <p>Nenhum produto cadastrado nesta tabela.</p>
                      <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>Importar Produtos Cadastrados</Button>
                    </div>
                  </td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{item.product?.code || '-'}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.product?.description || 'Produto removido'}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        R$ {item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
                      <td className="px-4 py-3 text-center">{item.max_discount_percent ? `${item.max_discount_percent}%` : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenItemModal(item)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (window.confirm('Remover este item?')) deleteItemMutation.mutate(item.id)
                            }}
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
          <div className="p-3 border-t border-border/50 text-xs text-muted-foreground flex justify-between bg-muted/10">
            <span>Para editar o preço ou os descontos, clique no ícone do lápis.</span>
            <span>Total de {items.length} itens</span>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-lg shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-lg font-semibold">{editingItemId ? 'Editar Produto' : 'Novo Produto na Tabela'}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item *</label>
                <select
                  required
                  className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={itemForm.product_id}
                  onChange={e => setItemForm({ ...itemForm, product_id: e.target.value })}
                  disabled={Boolean(editingItemId)} // Prevent changing product when editing
                >
                  <option value="" disabled>Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.description}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço de Venda (R$) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price || ''}
                    onChange={e => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Desconto (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemForm.discount_percent || ''}
                    onChange={e => setItemForm({ ...itemForm, discount_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Desconto Máximo (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemForm.max_discount_percent || ''}
                    onChange={e => setItemForm({ ...itemForm, max_discount_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saveItemMutation.isPending} className="shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4 mr-2" />
                  {saveItemMutation.isPending ? 'Salvando...' : 'Salvar Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT BY GROUP MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-lg shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-lg font-semibold">Importar por Grupos</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsImportModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione os grupos de produtos que deseja importar para esta tabela. Todos os produtos selecionados entrarão com preço zerado e poderão ser editados depois.
              </p>

              <div className="border border-border/50 rounded-md divide-y divide-border/50 max-h-60 overflow-y-auto">
                {productGroups.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Nenhum grupo de produtos encontrado no sistema.</div>
                ) : (
                  productGroups.map(group => (
                    <label key={group} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                        checked={selectedGroups.includes(group)}
                        onChange={() => toggleGroup(group)}
                      />
                      <span className="text-sm font-medium">{group}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedGroups(productGroups)}>Selecionar Todos</Button>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedGroups([])}>Limpar</Button>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                <Button 
                  type="button" 
                  onClick={handleImportByGroups} 
                  disabled={bulkImportMutation.isPending || selectedGroups.length === 0} 
                  className="shadow-lg shadow-primary/20"
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  {bulkImportMutation.isPending ? 'Importando...' : 'Importar Produtos'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
