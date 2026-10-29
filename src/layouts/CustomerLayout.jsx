import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import MobileBottomNav from '../components/common/MobileBottomNav'

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
