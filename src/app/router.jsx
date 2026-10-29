import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts
import CustomerLayout from '../layouts/CustomerLayout'
import AdminLayout from '../components/admin/AdminLayout'

// Customer Pages
import Home from '../pages/Home'
import Shop from '../pages/Shop'
import ProductDetails from '../pages/ProductDetails'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import Login from '../pages/Login'
import Register from '../pages/Register'
import MyOrders from '../pages/MyOrders'
import OrderDetailPage from '../pages/customer/OrderDetailPage'
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage'
import ProfilePage from '../pages/customer/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'

// Admin Pages
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import Dashboard from '../pages/admin/Dashboard'
import Products from '../pages/admin/Products'
import Categories from '../pages/admin/Categories'
import Orders from '../pages/admin/Orders'
import AdminOrderDetail from '../pages/admin/AdminOrderDetail'
import Inventory from '../pages/admin/Inventory'
import Customers from '../pages/admin/Customers'
import AdminReports from '../pages/admin/AdminReports'
import Settings from '../pages/admin/Settings'

// Route Guards
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

export function AppRouter() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/category/:slug" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="/orders/:orderId" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Admin Back-Office Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter

