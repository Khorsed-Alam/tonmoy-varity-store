import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import ShopPage from './pages/customer/ShopPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage'
import LoginPage from './pages/customer/LoginPage'
import RegisterPage from './pages/customer/RegisterPage'
import ProfilePage from './pages/customer/ProfilePage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import NotFoundPage from './pages/NotFoundPage'

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminInventory from './pages/admin/AdminInventory'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'

// Guards
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-fresh border-t-transparent" />
  </div>
  return user ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-fresh border-t-transparent" />
  </div>
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/category/:slug" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/order-confirmation/:orderId" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
        <Route path="/orders/:orderId" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
