import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { priceTablesApi } from '@/api/priceTables'
import { useSalesCart } from '@/stores/salesCart'
import type { CartItem } from '@/stores/salesCart'
import { Search, ArrowLeft, ShoppingCart, Filter, History, Tag, Star, X, LayoutGrid } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatters'

export default function SelectProducts() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'reposicoes' | 'promocoes' | 'destaques'>('todos')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const { customer_id, price_table_id, items, addItem, updateQuantity, getItemsCount, getTotal } = useSalesCart()

  // Redirect if no customer selected
  if (!customer_id) {
    navigate('/vendas/novo-pedido/clientes')
    return null
  }

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const { data: priceTableData } = useQuery({
    queryKey: ['price_table', price_table_id],
    queryFn: () => priceTablesApi.getPriceTable(price_table_id!),
    enabled: !!price_table_id,
  })
  const priceTableItems = priceTableData?.price_table_items || []

  const cartMap = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item: any) => map.set(item.product_id, item.quantity))
    return map
  }, [items])

  const productsWithPrices = useMemo(() => {
    return products.map((product: any) => {
      let finalPrice = 0
      
      if (price_table_id) {
        const tableItem = priceTableItems.find((pti: any) => pti.product_id === product.id)
        if (tableItem) {
          finalPrice = tableItem.price
        }
      }

      return {
        ...product,
        finalPrice,
        cartQuantity: cartMap.get(product.id) || 0
      }
    })
  }, [products, priceTableItems, price_table_id, cartMap])

  const categories = useMemo(() => {
    const cats = new Set(products.map((p: any) => p.group_name).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [products])

  const filteredProducts = productsWithPrices.filter(p => {
    // Aba filter
    if (activeTab === 'reposicoes') {
      // TODO: Filter by past purchases (requires sales history data). For now, return empty or all.
      // We will let it show nothing to indicate no reposicoes found, or just show all for demo.
      // Let's show nothing for now to simulate the filter working.
      return false
    }
    if (activeTab === 'promocoes') {
      // Todo: Add is_promo flag.
      return false
    }
    if (activeTab === 'destaques') {
      // Todo: Add is_highlight flag.
      return false
    }

    // Category filter
    if (selectedCategory === 'sem-categoria') {
      if (p.group_name) return false
    } else if (selectedCategory && selectedCategory !== 'all') {
      if (p.group_name !== selectedCategory) return false
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return p.description.toLowerCase().includes(term) || p.code?.toLowerCase().includes(term)
    }
    return true
  })

  const handleAdd = (product: any) => {
    const availableStock = Math.max(0, (product.stock || 0) - (product.reserved_stock || 0))
    if (product.cartQuantity === 0) {
      if (1 > availableStock) {
        return // O botão já estará desabilitado, mas por segurança
      }
      addItem({
        product_id: product.id,
        name: product.description,
        code: product.code || '',
        price: product.finalPrice,
        quantity: 1,
        stock: availableStock
      })
    } else {
      if (product.cartQuantity + 1 > availableStock) {
        return // Limita o botão de +
      }
      updateQuantity(product.id, product.cartQuantity + 1)
    }
  }

  const handleRemove = (product: any) => {
    if (product.cartQuantity > 0) {
      updateQuantity(product.id, product.cartQuantity - 1)
    }
  }

  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto pb-40">
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Adicionar Produtos</h1>
          <p className="text-sm text-muted-foreground">Selecione os produtos para este pedido</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border flex overflow-x-auto hide-scrollbar sticky top-[52px] z-10">
        <button 
          onClick={() => setActiveTab('todos')}
          className={`flex-1 min-w-[80px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'todos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Todos</span>
        </button>
        <button 
          onClick={() => setActiveTab('reposicoes')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'reposicoes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reposições</span>
        </button>
        <button 
          onClick={() => setActiveTab('promocoes')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'promocoes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Promoções</span>
        </button>
        <button 
          onClick={() => setActiveTab('destaques')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'destaques' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Destaques</span>
        </button>
      </div>

      <div className="bg-card p-4 shadow-sm sticky top-[118px] z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou código" 
            className="pl-10 h-12 bg-muted border-none text-base rounded-xl text-foreground"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-12 w-12 shrink-0 rounded-xl ${selectedCategory && selectedCategory !== 'all' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
          onClick={() => setIsCategoryModalOpen(true)}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-auto pb-6">
        {loadingProducts ? (
          <div className="p-8 text-center text-muted-foreground">Carregando produtos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const availableStock = Math.max(0, (product.stock || 0) - (product.reserved_stock || 0))
              const isOutOfStock = availableStock <= 0
              
              return (
                <div key={product.id} className={`bg-card rounded-xl p-3 shadow-sm border border-border flex items-center justify-between gap-3 ${product.cartQuantity > 0 ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-xs text-muted-foreground font-mono mb-0.5">{product.code}</p>
                    <h3 className="font-bold text-sm text-foreground leading-tight mb-1">{product.description}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-bold text-emerald-600">{formatCurrency(product.finalPrice)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${isOutOfStock ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                        Disp: {availableStock}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end">
                    {product.cartQuantity === 0 ? (
                      <button 
                        onClick={() => handleAdd(product)}
                        disabled={isOutOfStock}
                        className={`h-10 w-24 rounded-lg font-bold text-sm transition-colors ${
                          isOutOfStock ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary/10 text-primary active:bg-primary/20'
                        }`}
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-1 shadow-sm">
                        <button 
                          onClick={() => handleRemove(product)}
                          className="h-8 w-8 rounded flex items-center justify-center bg-muted text-muted-foreground active:bg-muted/80"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-foreground">{product.cartQuantity}</span>
                        <button 
                          onClick={() => handleAdd(product)}
                          disabled={product.cartQuantity >= availableStock}
                          className={`h-8 w-8 rounded flex items-center justify-center transition-colors ${
                            product.cartQuantity >= availableStock ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-primary/10 text-primary active:bg-primary/20'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium text-sm">{getItemsCount()} itens selecionados</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total do Pedido</p>
            <p className="font-bold text-xl text-emerald-600">{formatCurrency(getTotal())}</p>
          </div>
        </div>
        <Button 
          className="w-full h-12 text-base font-bold rounded-xl"
          disabled={getItemsCount() === 0}
          onClick={() => navigate('/vendas/novo-pedido/carrinho')}
        >
          Avançar para o Carrinho
        </Button>
      </div>
      
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="w-10" /> {/* Spacer */}
              <h2 className="font-bold text-lg text-foreground">Categorias</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 rounded-full text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto p-2">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${!selectedCategory || selectedCategory === 'all' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                onClick={() => { setSelectedCategory('all'); setIsCategoryModalOpen(false); }}
              >
                Selecionar todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                  onClick={() => { setSelectedCategory(cat); setIsCategoryModalOpen(false); }}
                >
                  {cat}
                </button>
              ))}
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${selectedCategory === 'sem-categoria' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                onClick={() => { setSelectedCategory('sem-categoria'); setIsCategoryModalOpen(false); }}
              >
                Produtos sem categoria
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pb-safe { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
