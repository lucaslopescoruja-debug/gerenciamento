import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatters'
import { productsApi } from '@/api/products'
import { toast } from '@/components/ui/toaster'

interface ProductSearchInlineProps {
  priceTableId?: string | null
  currentItems: any[]
  onUpdateQuantity: (productId: string, quantity: number, price: number) => void
}

export function ProductSearchInline({ priceTableId, currentItems, onUpdateQuantity }: ProductSearchInlineProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'repositions' | 'promotions' | 'highlights'>('all')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const { data: priceTableData } = useQuery({
    queryKey: ['price_table', priceTableId],
    queryFn: async () => {
      if (!priceTableId) return null
      const { priceTablesApi } = await import('@/api/priceTables')
      return priceTablesApi.getPriceTable(priceTableId)
    },
    enabled: !!priceTableId
  })
  const priceTableItems = priceTableData?.price_table_items || []

  const productsWithPrices = useMemo(() => {
    return products.map((product: any) => {
      let finalPrice = 0
      if (priceTableId) {
        const tableItem = priceTableItems.find((pti: any) => pti.product_id === product.id)
        if (tableItem) {
          finalPrice = tableItem.price
        }
      }
      return {
        ...product,
        finalPrice
      }
    })
  }, [products, priceTableItems, priceTableId])

  const filteredProducts = useMemo(() => {
    let filtered = productsWithPrices
    
    // Filtro por abas
    if (activeTab === 'promotions') {
      filtered = []
    } else if (activeTab === 'highlights') {
      filtered = []
    } else if (activeTab === 'repositions') {
      filtered = []
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.description?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.ean?.includes(term)
      )
    }
    
    return filtered.slice(0, 50)
  }, [productsWithPrices, searchTerm, activeTab])

  const handleUpdate = (productId: string, delta: number) => {
    const product = productsWithPrices.find(p => p.id === productId)
    if (!product) return

    const currentItem = currentItems.find(i => i.product_id === productId)
    const currentQty = currentItem?.quantity || 0
    const nextQty = Math.max(0, currentQty + delta)
    
    if (delta > 0) {
      const availableStock = (product.stock || 0) - (product.reserved_stock || 0)
      const realAvailable = availableStock + currentQty
      
      if (nextQty > realAvailable) {
        toast.error(`Quantidade indisponível. Saldo máximo: ${realAvailable}`)
        return
      }
    }

    onUpdateQuantity(productId, nextQty, product.finalPrice)
  }

  return (
    <div className="flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden h-[600px] max-h-[70vh]">
      {/* TABS */}
      <div className="flex w-full text-xs font-bold text-muted-foreground bg-muted/10 border-b border-border overflow-x-auto hide-scrollbar">
        <div 
          className={`flex-1 min-w-[100px] text-center py-4 border-b-2 cursor-pointer transition-colors ${activeTab === 'all' ? 'border-primary text-foreground bg-background' : 'border-transparent hover:bg-muted/30'}`}
          onClick={() => setActiveTab('all')}
        >
          TODOS
        </div>
        <div 
          className={`flex-1 min-w-[100px] text-center py-4 border-b-2 cursor-pointer transition-colors ${activeTab === 'repositions' ? 'border-primary text-foreground bg-background' : 'border-transparent hover:bg-muted/30'}`}
          onClick={() => setActiveTab('repositions')}
        >
          REPOSIÇÕES
        </div>
        <div 
          className={`flex-1 min-w-[100px] text-center py-4 border-b-2 cursor-pointer transition-colors ${activeTab === 'promotions' ? 'border-primary text-foreground bg-background' : 'border-transparent hover:bg-muted/30'}`}
          onClick={() => setActiveTab('promotions')}
        >
          PROMOÇÕES
        </div>
        <div 
          className={`flex-1 min-w-[100px] text-center py-4 border-b-2 cursor-pointer transition-colors ${activeTab === 'highlights' ? 'border-primary text-foreground bg-background' : 'border-transparent hover:bg-muted/30'}`}
          onClick={() => setActiveTab('highlights')}
        >
          DESTAQUES
        </div>
      </div>

      {/* BUSCA */}
      <div className="p-3 bg-background border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, código ou código de barras..." 
            className="pl-9 bg-muted/10 border-border h-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="flex-1 overflow-y-auto bg-muted/5 p-2">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando produtos...</div>
        ) : activeTab !== 'all' && filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">Em produção</span>
            <p>Esta funcionalidade estará disponível em breve.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredProducts.map((product: any) => {
              const currentItem = currentItems.find(i => i.product_id === product.id)
              const qty = currentItem?.quantity || 0

              return (
                <div key={product.id} className="flex bg-card border border-border rounded-lg p-2 gap-3 items-stretch shadow-sm hover:shadow transition-shadow">
                  {/* Imagem */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex items-center justify-center shrink-0 border border-border/50">
                    {product.image_url ? (
                       <img src={product.image_url} alt="Foto" className="w-full h-full object-cover rounded-md" />
                    ) : (
                       <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="font-semibold text-sm leading-tight line-clamp-2">{product.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Cód: {product.code}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-emerald-600">{formatCurrency(product.finalPrice)}</span>
                    </div>
                  </div>

                  {/* Controles (+ / -) */}
                  <div className="flex flex-col items-center justify-between w-[80px] sm:w-[90px] shrink-0 border-l border-border/50 pl-2">
                    <button 
                      className="w-full h-8 sm:h-9 bg-[#1a1530] hover:bg-[#2a2540] text-white rounded flex items-center justify-center transition-colors shadow-sm"
                      onClick={() => handleUpdate(product.id, 1)}
                    >
                      <span className="font-bold">+</span>
                    </button>
                    
                    <div className="font-bold text-sm sm:text-base py-1">
                      {qty}
                    </div>
                    
                    <button 
                      className="w-full h-8 sm:h-9 bg-muted hover:bg-muted/80 text-foreground rounded flex items-center justify-center transition-colors border border-border"
                      onClick={() => handleUpdate(product.id, -1)}
                      disabled={qty === 0}
                    >
                      <span className="font-bold">-</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
