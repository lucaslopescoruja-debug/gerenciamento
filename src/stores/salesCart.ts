import { create, StoreApi } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  name: string
  code: string
  price: number
  quantity: number
  stock: number
  discount_perc?: number
}

interface SalesCartStore {
  customer_id: string | null
  price_table_id: string | null
  payment_condition_id: string | null
  items: CartItem[]
  notes: string
  
  setCustomer: (id: string, priceTableId: string | null) => void
  setPaymentCondition: (id: string) => void
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setNotes: (notes: string) => void
  clearCart: () => void
  
  // Computed
  getTotal: () => number
  getItemsCount: () => number
}

export const useSalesCart = create<SalesCartStore>()(
  persist(
    (set, get) => ({
      customer_id: null,
      price_table_id: null,
      payment_condition_id: null,
      items: [],
      notes: '',

      setCustomer: (id: string, priceTableId: string | null) => set({ customer_id: id, price_table_id: priceTableId, items: [] }),
      setPaymentCondition: (id: string) => set({ payment_condition_id: id }),
      
      addItem: (item: CartItem) => set((state: SalesCartStore) => {
        const existing = state.items.find(i => i.product_id === item.product_id)
        if (existing) {
          return {
            items: state.items.map(i => 
              i.product_id === item.product_id 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          }
        }
        return { items: [...state.items, item] }
      }),

      removeItem: (productId: string) => set((state: SalesCartStore) => ({
        items: state.items.filter(i => i.product_id !== productId)
      })),

      updateQuantity: (productId: string, quantity: number) => set((state: SalesCartStore) => {
        if (quantity <= 0) {
          return { items: state.items.filter(i => i.product_id !== productId) }
        }
        return {
          items: state.items.map(i => 
            i.product_id === productId ? { ...i, quantity } : i
          )
        }
      }),

      setNotes: (notes: string) => set({ notes }),

      clearCart: () => set({
        customer_id: null,
        price_table_id: null,
        payment_condition_id: null,
        items: [],
        notes: ''
      }),

      getTotal: () => {
        const { items } = get()
        return items.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0)
      },

      getItemsCount: () => {
        const { items } = get()
        return items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0)
      }
    }),
    {
      name: 'sales-cart-storage'
    }
  )
)
