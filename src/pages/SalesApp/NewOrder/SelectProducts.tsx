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
    if (product.cartQuantity === 0) {
      addItem({
        product_id: product.id,
        name: product.description,
        code: product.code || '',
        price: product.finalPrice,
        quantity: 1,
        stock: product.stock || 0
      })
    } else {
      updateQuantity(product.id, product.cartQuantity + 1)
    }
  }

  const handleRemove = (product: any) => {
    if (product.cartQuantity > 0) {
      updateQuantity(product.id, product.cartQuantity - 1)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-[140px]"> {/* Extra padding for the bottom bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="font-bold text-lg text-gray-900">Adicionar Produtos</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex overflow-x-auto hide-scrollbar sticky top-[52px] z-10">
        <button 
          onClick={() => setActiveTab('todos')}
          className={`flex-1 min-w-[80px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'todos' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Todos</span>
        </button>
        <button 
          onClick={() => setActiveTab('reposicoes')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'reposicoes' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reposições</span>
        </button>
        <button 
          onClick={() => setActiveTab('promocoes')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'promocoes' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Promoções</span>
        </button>
        <button 
          onClick={() => setActiveTab('destaques')}
          className={`flex-1 min-w-[90px] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'destaques' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Destaques</span>
        </button>
      </div>

      <div className="bg-white p-4 shadow-sm sticky top-[118px] z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Buscar por nome ou código" 
            className="pl-10 h-12 bg-gray-100 border-none text-base rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-12 w-12 shrink-0 rounded-xl ${selectedCategory && selectedCategory !== 'all' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setIsCategoryModalOpen(true)}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loadingProducts ? (
          <div className="p-8 text-center text-gray-500">Carregando produtos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const isOutOfStock = (product.stock || 0) <= 0
              
              return (
                <div key={product.id} className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3 ${product.cartQuantity > 0 ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-xs text-gray-500 font-mono mb-0.5">{product.code}</p>
                    <h3 className="font-bold text-sm text-gray-900 leading-tight mb-1">{product.description}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-bold text-emerald-600">{formatCurrency(product.finalPrice)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        Estoque: {product.stock || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end">
                    {product.cartQuantity === 0 ? (
                      <button 
                        onClick={() => handleAdd(product)}
                        disabled={isOutOfStock}
                        className={`h-10 w-24 rounded-lg font-bold text-sm transition-colors ${
                          isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 text-primary active:bg-primary/20'
                        }`}
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <button 
                          onClick={() => handleRemove(product)}
                          className="h-8 w-8 rounded flex items-center justify-center bg-gray-50 text-gray-600 active:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-gray-900">{product.cartQuantity}</span>
                        <button 
                          onClick={() => handleAdd(product)}
                          className="h-8 w-8 rounded flex items-center justify-center bg-primary/10 text-primary active:bg-primary/20"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-600">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium text-sm">{getItemsCount()} itens selecionados</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total do Pedido</p>
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
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="w-10" /> {/* Spacer */}
              <h2 className="font-bold text-lg text-gray-900">Categorias</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto p-2">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${!selectedCategory || selectedCategory === 'all' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => { setSelectedCategory('all'); setIsCategoryModalOpen(false); }}
              >
                Selecionar todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => { setSelectedCategory(cat); setIsCategoryModalOpen(false); }}
                >
                  {cat}
                </button>
              ))}
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${selectedCategory === 'sem-categoria' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
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
