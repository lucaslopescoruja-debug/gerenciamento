import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Image as ImageIcon, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatters'
import { productsApi } from '@/api/products'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProducts: (products: { productId: string, quantity: number, price: number }[]) => void
  currentItems: { product_id: string, quantity: number }[]
  priceTableId?: string | null
}

export function ProductSelectModal({ isOpen, onClose, onAddProducts, currentItems, priceTableId }: ProductSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeTab, setActiveTab] = useState<'repositions' | 'promotions' | 'highlights'>('repositions')

  // We maintain a local cart state so the user can freely use +/- without saving to DB on every click
  const [localCart, setLocalCart] = useState<Record<string, number>>({})

  // Initialize localCart when modal opens
  useMemo(() => {
    if (isOpen) {
      const initialCart: Record<string, number> = {}
      currentItems.forEach(item => {
        initialCart[item.product_id] = item.quantity
      })
      setLocalCart(initialCart)
    }
  }, [isOpen, currentItems])

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
    enabled: isOpen
  })

  const { data: priceTableData } = useQuery({
    queryKey: ['price_table', priceTableId],
    queryFn: async () => {
      if (!priceTableId) return null
      const { priceTablesApi } = await import('@/api/priceTables')
      return priceTablesApi.getPriceTable(priceTableId)
    },
    enabled: !!priceTableId && isOpen
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

  const categories = useMemo(() => {
    const cats = new Set(productsWithPrices.map((p: any) => p.group_name).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [productsWithPrices])

  const filteredProducts = useMemo(() => {
    let filtered = productsWithPrices
    
    if (selectedCategory) {
      filtered = filtered.filter((p: any) => p.group_name === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.description?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.ean?.includes(term)
      )
    }
    
    return filtered.slice(0, 50) // limit initial load to 50 for performance
  }, [productsWithPrices, searchTerm, selectedCategory])

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setLocalCart(prev => {
      const current = prev[productId] || 0
      const next = Math.max(0, current + delta)
      
      // Stock validation
      const product = productsWithPrices.find(p => p.id === productId)
      if (product) {
        const availableStock = (product.stock || 0) - (product.reserved_stock || 0)
        // If we are increasing and it exceeds stock, we block it
        if (delta > 0 && next > availableStock) {
          // Find if this item was already in the DB to add its existing reserved quantity to available stock
          const existingItem = currentItems.find(i => i.product_id === productId)
          const realAvailable = availableStock + (existingItem?.quantity || 0)
          
          if (next > realAvailable) {
            alert(`Quantidade indisponível. Saldo máximo: ${realAvailable}`)
            return prev
          }
        }
      }

      const updated = { ...prev }
      if (next === 0) {
        delete updated[productId]
      } else {
        updated[productId] = next
      }
      return updated
    })
  }

  const handleSave = () => {
    // Only send the ones that are > 0.
    // The parent component should probably replace the entire order items or merge them.
    // For simplicity, we just pass the new localCart mapped to array.
    const newItems = Object.keys(localCart).map(productId => {
      const product = productsWithPrices.find(p => p.id === productId) as any
      return {
        productId,
        quantity: localCart[productId],
        price: product?.finalPrice || 0
      }
    })
    onAddProducts(newItems)
    onClose()
  }

  const totalItems = Object.values(localCart).reduce((a, b) => a + b, 0)
  const totalValue = Object.entries(localCart).reduce((sum, [productId, quantity]) => {
    const product = productsWithPrices.find(p => p.id === productId) as any
    return sum + ((product?.finalPrice || 0) * quantity)
  }, 0)

  // Se quisermos que fique tela cheia no mobile e modal no desktop:
  // sm:max-w-[800px] sm:h-[80vh] para desktop
  // h-full w-full max-w-full m-0 rounded-none para mobile

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 flex flex-col gap-0 w-full h-[100dvh] max-w-full sm:max-w-3xl sm:h-[85vh] sm:rounded-xl overflow-hidden bg-background">
        
        {/* HEADER MODAL */}
        <div className="bg-card border-b border-border z-10 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <Button variant="ghost" className="text-muted-foreground" onClick={onClose}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="ghost" size="icon" className={selectedCategory ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                  <Filter className="h-5 w-5" />
                </Button>
                <select 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  title="Filtrar por categoria"
                >
                  <option value="">Todas Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button variant="ghost" className="text-primary font-semibold" onClick={handleSave}>Concluir</Button>
            </div>
          </div>
          
          {/* TABS */}
          <div className="flex w-full text-xs font-bold text-muted-foreground">
            <div 
              className={`flex-1 text-center py-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'repositions' ? 'border-primary text-foreground' : 'border-transparent'}`}
              onClick={() => setActiveTab('repositions')}
            >
              REPOSIÇÕES
            </div>
            <div 
              className={`flex-1 text-center py-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'promotions' ? 'border-primary text-foreground' : 'border-transparent'}`}
              onClick={() => setActiveTab('promotions')}
            >
              PROMOÇÕES
            </div>
            <div 
              className={`flex-1 text-center py-3 border-b-2 cursor-pointer transition-colors ${activeTab === 'highlights' ? 'border-primary text-foreground' : 'border-transparent'}`}
              onClick={() => setActiveTab('highlights')}
            >
              DESTAQUES
            </div>
          </div>

          <div className="p-2 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar produtos..." 
                className="pl-9 bg-background border-border"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="flex-1 bg-muted/10 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando produtos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</div>
          ) : (
            <div className="flex flex-col">
              {filteredProducts.map((product: any) => {
                const qty = localCart[product.id] || 0
                return (
                  <div key={product.id} className="flex border-b border-border bg-card p-3 gap-3 items-stretch">
                    {/* Imagem (quadrado cinza) */}
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border">
                      {product.image_url ? (
                         <img src={product.image_url} alt="Foto" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                         <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="font-semibold text-sm leading-tight line-clamp-2 uppercase">{product.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{product.code}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-base">{formatCurrency(product.finalPrice)}</span>
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <span className="text-[10px] font-bold">$</span>
                        </div>
                      </div>
                    </div>

                    {/* Controles (+ / -) */}
                    <div className="flex flex-col items-center justify-between w-[90px] shrink-0 border-l border-border pl-2">
                      <div className="text-[10px] text-muted-foreground w-full text-center">
                        Estoque: {(product.stock || 0) - (product.reserved_stock || 0)}
                      </div>
                      
                      {qty === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 w-full gap-1">
                          <span className="text-2xl font-bold">0</span>
                          <span className="text-xs text-muted-foreground">un</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center flex-1 w-full gap-1 text-primary">
                          <span className="text-2xl font-black">{qty}</span>
                          <span className="text-xs">un</span>
                        </div>
                      )}

                      <div className="flex w-full overflow-hidden rounded shadow-sm border border-border mt-1">
                        <button 
                          className="flex-1 bg-muted hover:bg-muted/80 h-9 flex items-center justify-center border-r border-border transition-colors disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          disabled={qty === 0}
                        >
                          <span className="text-lg font-bold">-</span>
                        </button>
                        <button 
                          className="flex-1 bg-[#1a1530] hover:bg-[#2a2540] text-white h-9 flex items-center justify-center transition-colors"
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                        >
                          <span className="text-lg font-bold">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER FIXO (Resumo) */}
        <div className="bg-card border-t border-border p-4 flex items-center justify-between z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{totalItems}</span> itens adicionados
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-bold text-emerald-600 text-lg">{formatCurrency(totalValue)}</span>
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ml-1">
              <span className="text-[10px] text-muted-foreground font-bold">$</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
