import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

export const CartContext = createContext(null)

const BASE_CART_KEY = 'tvs_cart'

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
      return { ...state, items: Array.isArray(action.payload) ? action.payload : [] }
    default:
      return state
  }
}

const initialState = { items: [] }

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { user } = useAuth()

  // User-specific cart key isolation: each authenticated user gets their own dedicated storage
  const cartKey = user?.id ? `${BASE_CART_KEY}_user_${user.id}` : `${BASE_CART_KEY}_guest`
  const activeCartKeyRef = useRef(cartKey)
  const isHydratedRef = useRef(false)

  // Hydrate cart specifically for the active user (switches immediately when logging in / logging out)
  useEffect(() => {
    activeCartKeyRef.current = cartKey
    isHydratedRef.current = false

    try {
      // Clean legacy shared cart if present
      if (localStorage.getItem('tvs_cart')) {
        localStorage.removeItem('tvs_cart')
      }

      const saved = localStorage.getItem(cartKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'HYDRATE', payload: Array.isArray(parsed) ? parsed : [] })
      } else {
        dispatch({ type: 'CLEAR_CART' })
      }
    } catch {
      dispatch({ type: 'CLEAR_CART' })
    } finally {
      isHydratedRef.current = true
    }
  }, [cartKey])

  // Persist only to the active user's dedicated storage key once hydrated
  useEffect(() => {
    if (!isHydratedRef.current) return
    try {
      localStorage.setItem(activeCartKeyRef.current, JSON.stringify(state.items))
    } catch (err) {
      console.warn('Could not persist user cart:', err)
    }
  }, [state.items])

  const addItem = (product) => dispatch({ type: 'ADD_ITEM', payload: product })
  const removeItem = (productId) => dispatch({ type: 'REMOVE_ITEM', payload: productId })
  const updateQuantity = (productId, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity } })
  const clearCart = () => {
    try {
      localStorage.removeItem(activeCartKeyRef.current)
    } catch {
      // ignore
    }
    dispatch({ type: 'CLEAR_CART' })
  }

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

export default CartContext
