import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { userType } = useAuth()

  return (
    <div className="layout layout-app">
      <Header userType={userType} />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
