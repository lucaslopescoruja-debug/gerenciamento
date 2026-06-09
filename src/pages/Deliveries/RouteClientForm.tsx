import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { productsApi } from '@/api/products'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, User, Search, Trash2, Save, MapPin, Phone, StickyNote, Hash } from 'lucide-react'
import { Navigate } from 'react-router-dom'

interface NewItem {
  id?: string
  tempId: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
}

export default function RouteClientForm() {
  const { id, clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<NewItem[]>([])
  const [originalItemIds, setOriginalItemIds] = useState<string[]>([])
  const [codeSearch, setCodeSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['delivery_client', clientId],
    queryFn: () => deliveriesApi.getDeliveryClient(clientId!),
    enabled: !!clientId
  })
  
  const routeId = id || client?.delivery_route_id

  const { data: route, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['delivery_route', routeId],
    queryFn: () => deliveriesApi.getDeliveryRoute(routeId!),
    enabled: !!routeId,
  })

  const { data: clientItems } = useQuery({
    queryKey: ['delivery_items', clientId],
    queryFn: () => deliveriesApi.getDeliveryItems(clientId!),
    enabled: !!clientId
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  useEffect(() => {
    if (client) {
      setName(client.name || '')
      setAddress(client.address || '')
      setPhone(client.phone || '')
      setOrderNumber(client.order_number || '')
      setNotes(client.notes || '')
    }
  }, [client])

  useEffect(() => {
    if (clientItems && clientItems.length > 0 && items.length === 0) {
      setItems(clientItems.map(i => ({
        id: i.id,
        tempId: i.id,
        product_id: i.product_id,
        product_code: i.product_code,
        description: i.description,
        quantity_expected: i.quantity_expected
      })))
      setOriginalItemIds(clientItems.map(i => i.id))
    }
  }, [clientItems])

  useEffect(() => {
    if (codeSearch.trim().length > 0) {
      const term = normalizeCode(codeSearch.trim());
      const filtered = products.filter(p => 
        normalizeCode(p.code).includes(term) || 
        (p.external_code && normalizeCode(p.external_code).includes(term)) || 
        normalizeCode(p.description).includes(term)
      ).slice(0, 10);
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  }, [codeSearch, products]);

  const addExactMatch = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;
    const term = normalizeCode(raw);
    const product = products.find(p =>
      normalizeCode(p.code) === term ||
      (p.external_code && normalizeCode(p.external_code) === term)
    )
    if (!product) { 
      toast.error('Produto não encontrado com esse código exato'); 
      return; 
    }
    addSelectedProduct(product);
  }

  const addSelectedProduct = (product: any) => {
    const exists = items.find(i => i.product_code === product.code)
    const currentQty = exists ? exists.quantity_expected : 0
    const targetQty = currentQty + 1
    
    if (targetQty > product.stock) {
      if (product.stock <= 0) {
        toast.warning(`Produto com estoque zerado no sistema: ${product.description}. Confirmar no físico.`)
      } else {
        toast.warning(`Estoque no sistema menor que o previsto para ${product.description}. Pedido: ${targetQty}, Disponível: ${product.stock}. Confirmar no físico.`)
      }
    }

    if (exists) {
      setItems(prev => prev.map(i => i.product_code === product.code ? { ...i, quantity_expected: targetQty } : i))
      toast.success(`Quantidade aumentada para ${product.description}`)
    } else {
      setItems(prev => [...prev, { tempId: `t${Date.now()}`, product_id: product.id, product_code: product.code, description: product.description, quantity_expected: 1 }])
      toast.success(`${product.description} adicionado`)
    }
    setCodeSearch('')
    setShowDropdown(false)
  }

  const updateQty = (tempId: string, qty: number) => {
    setItems(prev => prev.map(i => {
      if (i.tempId === tempId) {
        const product = products.find(p => p.code === i.product_code)
        const maxQty = product?.stock || 0
        const targetQty = Math.max(1, qty)
        if (targetQty > maxQty) {
          if (maxQty <= 0) {
            toast.warning(`Produto com estoque zerado no sistema: ${i.description}. Confirmar no físico.`)
          } else {
            toast.warning(`Estoque no sistema menor que o previsto para ${i.description}. Pedido: ${targetQty}, Disponível: ${maxQty}. Confirmar no físico.`)
          }
        }
        return { ...i, quantity_expected: targetQty }
      }
      return i
    }))
  }

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  const importMutation = useMutation({
    mutationFn: (clientData: any[]) => deliveriesApi.importDeliveryClients(routeId!, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', routeId] })
      toast.success('Cliente adicionado com sucesso!')
      navigate(-1)
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar cliente: ${error.message}`)
    }
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      await deliveriesApi.updateDeliveryClient(clientId!, {
        name: name.trim(),
        address: address.trim() || '',
        phone: phone.trim() || '',
        order_number: orderNumber.trim() || undefined,
        notes: notes.trim() || ''
      })

      const currentIds = items.filter(i => i.id).map(i => i.id)
      const deletedIds = originalItemIds.filter(id => !currentIds.includes(id))
      const newItems = items.filter(i => !i.id)
      const updatedItems = items.filter(i => i.id)

      for (const delId of deletedIds) {
        await deliveriesApi.deleteDeliveryItem(delId)
      }
      for (const newItem of newItems) {
        await deliveriesApi.addDeliveryItem(clientId!, {
          product_id: newItem.product_id,
          product_code: newItem.product_code,
          description: newItem.description,
          quantity_expected: newItem.quantity_expected,
          quantity_scanned: 0,
          status: 'pending'
        })
      }
      for (const upItem of updatedItems) {
        await deliveriesApi.updateDeliveryItem(upItem.id!, {
          quantity_expected: upItem.quantity_expected
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery_clients', routeId] })
      queryClient.invalidateQueries({ queryKey: ['delivery_client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
      toast.success('Pedido do cliente atualizado!')
      navigate(-1)
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('O nome do cliente é obrigatório')
      return
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um produto para o cliente')
      return
    }

    if (clientId) {
      editMutation.mutate()
    } else {
      const payload = [{
        name: name.trim(),
        address: address.trim() || '',
        phone: phone.trim() || '',
        order_number: orderNumber.trim() || undefined,
        notes: notes.trim() || '',
        items: items.map(i => ({
          product_id: i.product_id,
          product_code: i.product_code,
          description: i.description,
          quantity_expected: i.quantity_expected
        }))
      }]
      importMutation.mutate(payload)
    }
  }

  if (!isManager) {
    if (clientId) return <Navigate to={`/entregas/cliente/${clientId}`} replace />
    return <Navigate to={`/entregas/${routeId}`} replace />
  }

  if (isLoadingRoute || isClientLoading) return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 slide-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">{clientId ? 'Editar Pedido' : 'Novo Cliente'}</h1>
          <p className="text-sm text-muted-foreground">{clientId ? 'Editando informações e produtos' : `Adicionar avulso na Rota: ${route?.title || 'Sem título'}`}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Nome do Cliente *</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Supermercado XYZ"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /> Número do Pedido</Label>
                <Input 
                  value={orderNumber} 
                  onChange={e => setOrderNumber(e.target.value)} 
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Telefone</Label>
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço Completo</Label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Observações</Label>
              <Input 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <Label className="text-lg font-bold mb-3 flex items-center gap-2">Produtos do Pedido</Label>
              <p className="text-sm text-muted-foreground mb-4">Busque os produtos por código ou nome para adicioná-los ao pedido deste cliente.</p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addExactMatch(codeSearch)
                      }
                    }}
                    placeholder="Buscar código ou produto..." 
                    className="pl-10 h-12 text-lg"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map(product => (
                        <div 
                          key={product.id}
                          className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                          onClick={() => addSelectedProduct(product)}
                        >
                          <div className="font-bold text-foreground">{product.code} <span className="font-normal text-muted-foreground">- {product.description}</span></div>
                          <div className="text-xs text-muted-foreground mt-1">Estoque: {product.stock}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  className="h-12 px-6" 
                  onClick={() => addExactMatch(codeSearch)}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
                  <span>Produto</span>
                  <span>Qtd</span>
                </div>
                {items.map((item) => (
                  <div key={item.tempId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-colors">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-foreground text-sm truncate">{item.product_code}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Input 
                        type="number" 
                        value={item.quantity_expected || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setItems(prev => prev.map(i => i.tempId === item.tempId ? { ...i, quantity_expected: 0 } : i));
                          } else {
                            updateQty(item.tempId, parseInt(val, 10) || 1);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < 1) updateQty(item.tempId, 1);
                        }}
                        className="w-20 text-center font-bold"
                        min="1"
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.tempId)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                  <span className="font-bold text-primary">Total de Volumes</span>
                  <span className="text-2xl font-black text-primary">{items.reduce((sum, i) => sum + i.quantity_expected, 0)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg mt-6 bg-muted/30">
                Nenhum produto adicionado.
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full h-14 text-lg font-bold gap-2 shadow-lg hover:shadow-primary/25"
          disabled={importMutation.isPending || editMutation.isPending}
        >
          {importMutation.isPending || editMutation.isPending ? 'Salvando...' : <><Save className="h-6 w-6" /> {clientId ? 'Atualizar Pedido' : 'Salvar Cliente na Rota'}</>}
        </Button>
      </form>
    </div>
  )
}
