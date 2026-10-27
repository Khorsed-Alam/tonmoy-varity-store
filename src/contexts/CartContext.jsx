import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'tvs_cart'

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product_id === action.payload.product_id)
      if (existing) {
        const newQty = existing.quantity + (action.payload.quantity || 1)
        const capped = Math.min(newQty, action.payload.stock_quantity || 99)
        return {
          ...state,
          items: state.items.map(i =>
            i.product_id === action.payload.product_id
              ? { ...i, quantity: capped }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.product_id !== action.payload) }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.product_id !== action.payload.product_id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.product_id === action.payload.product_id
            ? { ...i, quantity: Math.min(action.payload.quantity, i.stock_quantity || 99) }
            : i
        ),
      }
    }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    case 'HYDRATE':
      return { ...state, items: action.payload }
    default:
      return state
  }
}

const initialState = { items: [] }

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) })
    } catch {
      // ignore parse errors
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const addItem = (product) => dispatch({ type: 'ADD_ITEM', payload: product })
  const removeItem = (productId) => dispatch({ type: 'REMOVE_ITEM', payload: productId })
  const updateQuantity = (productId, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items: state.items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
