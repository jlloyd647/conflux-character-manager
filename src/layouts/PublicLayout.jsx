import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'

export default function PublicLayout() {
  const { userType } = useAuth()

  return (
    <div className="layout layout-public">
      <Header userType={userType} />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
